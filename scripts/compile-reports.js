#!/usr/bin/env node
/**
 * Reports Compiler & Validator Script
 * Parses markdown reports in `reports/*.md`, validates against schema,
 * computes multi-model consensus (handling missing scores as null, not zero),
 * performs accurate security finding deduplication without conflating distinct flaws,
 * sanitizes absolute machine paths, and generates `src/data/reports.json`.
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');
const outputDir = path.join(rootDir, 'src', 'data');
const outputFile = path.join(outputDir, 'reports.json');

// Parse CLI flags
const isStrict = process.argv.includes('--strict');
const isValidateOnly = process.argv.includes('--validate-only');

/**
 * Sanitize absolute machine filesystem paths (e.g. /Users/name/... or file:///Users/...)
 */
export function sanitizePaths(text) {
  if (typeof text !== 'string') return text;
  // Match file:///Users/.../target/<repo>/ or file:///home/.../target/<repo>/
  let s = text.replace(/file:\/\/\/(?:Users|home)\/[^/\s"'`)]+(?:\/[^/\s"'`)]+)*\/target\/[^/\s"'`)]+\//g, '');
  // Match generic file:///Users/<user>/
  s = s.replace(/file:\/\/\/(?:Users|home)\/[^/\s"'`)]+\//g, '');
  // Match /Users/<user>/.../target/<repo>/
  s = s.replace(/(?:\/Users|\/home)\/[^/\s"'`)]+(?:\/[^/\s"'`)]+)*\/target\/[^/\s"'`)]+\//g, '');
  // Match /Users/<user>/ or /home/<user>/
  s = s.replace(/(?:\/Users|\/home)\/[a-zA-Z0-9._-]+\//g, '');
  // Windows absolute paths C:\Users\xxx\...
  s = s.replace(/[a-zA-Z]:\\Users\\[^\\]+\\/gi, '');
  return s;
}

/**
 * Parse Markdown file with YAML frontmatter
 */
export function parseMarkdownWithFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: {},
      markdown: content
    };
  }

  try {
    const metadata = YAML.parse(match[1]) || {};
    const markdown = match[2].trim();
    return { metadata, markdown };
  } catch (e) {
    return { metadata: {}, markdown: content, parseError: e.message };
  }
}

/**
 * Validate parsed report against rules
 */
export function validateReport(metadata, filename) {
  const errors = [];
  const warnings = [];

  if (!metadata.model || typeof metadata.model !== 'string') {
    errors.push(`Missing or invalid 'model' string`);
  }

  if (!metadata.model_id || typeof metadata.model_id !== 'string') {
    errors.push(`Missing or invalid 'model_id' string`);
  } else if (!/^[a-z0-9_-]+$/.test(metadata.model_id)) {
    warnings.push(`'model_id' should be kebab-case (got: '${metadata.model_id}')`);
  }

  if (!metadata.target_repo) {
    warnings.push(`Missing 'target_repo'`);
  }

  // Validate scores
  if (metadata.scores) {
    const validMetrics = ['overall', 'architecture', 'code_quality', 'security', 'documentation'];
    for (const metric of validMetrics) {
      const val = metadata.scores[metric];
      if (val !== undefined && val !== null) {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 10) {
          errors.push(`Score '${metric}' must be a number between 0.0 and 10.0 (got: ${val})`);
        }
      }
    }
  }

  // Validate security findings
  if (metadata.security_findings) {
    if (!Array.isArray(metadata.security_findings)) {
      errors.push(`'security_findings' must be an array`);
    } else {
      const validSeverities = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
      const validStatuses = new Set(['verified', 'probable', 'unverified']);

      metadata.security_findings.forEach((f, idx) => {
        if (!f.title) {
          warnings.push(`Finding #${idx + 1} is missing a 'title'`);
        }
        if (!f.severity || !validSeverities.has(f.severity.toUpperCase())) {
          warnings.push(`Finding #${idx + 1} ('${f.title || idx}') has invalid severity '${f.severity}', expected CRITICAL|HIGH|MEDIUM|LOW`);
        }
        if (f.status && !validStatuses.has(f.status.toLowerCase())) {
          warnings.push(`Finding #${idx + 1} has unrecognized status '${f.status}', expected verified|probable|unverified`);
        }
        if (f.confidence !== undefined && f.confidence !== null) {
          const conf = Number(f.confidence);
          if (isNaN(conf) || conf < 0 || conf > 1) {
            warnings.push(`Finding #${idx + 1} confidence should be 0.0 - 1.0 (got ${f.confidence})`);
          }
        }
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Safely parse a score value, returning null if missing or invalid
 */
export function parseScore(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

/**
 * Compute average of numeric values, ignoring null / undefined
 */
export function calculateAverage(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / valid.length).toFixed(1));
}

/**
 * Tokenize string into a set of normalized keywords for similarity calculation
 */
function tokenize(str) {
  if (!str) return new Set();
  return new Set(
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'risk', 'issue'].includes(w))
  );
}

/**
 * Compute Jaccard similarity between two token sets
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const VULN_CONCEPT_MAP = [
  { concept: 'dos_rate_limiting', terms: ['rate', 'limiting', 'limit', 'throttle', 'throttled', 'unthrottled', 'dos', 'denial', 'exhaustion', 'flooding'] },
  { concept: 'licensing', terms: ['license', 'licensing', 'unlicensed'] },
  { concept: 'state_persistence', terms: ['sqlite', 'storage', 'ephemeral', 'persistence', 'restart', 'restarts', 'data loss', 'loss'] },
  { concept: 'injection', terms: ['injection', 'sqli', 'xss', 'command injection'] },
  { concept: 'auth_credentials', terms: ['auth', 'authentication', 'unauthenticated', 'authorization', 'token', 'secret', 'password', 'key'] },
];

function extractConcepts(text) {
  const lower = (text || '').toLowerCase();
  const matched = new Set();
  for (const item of VULN_CONCEPT_MAP) {
    for (const term of item.terms) {
      if (lower.includes(term)) {
        matched.add(item.concept);
        break;
      }
    }
  }
  return matched;
}

/**
 * Check if two security findings represent the same underlying issue.
 * Avoids merging different vulnerabilities just because they occur in the same file!
 */
export function areFindingsSimilar(f1, f2) {
  const normFile1 = (f1.file || '').toLowerCase().trim();
  const normFile2 = (f2.file || '').toLowerCase().trim();
  const sameFile = normFile1 === normFile2 && normFile1.length > 0;
  const overlappingFile = normFile1.includes(normFile2) || normFile2.includes(normFile1);

  const text1 = `${f1.title} ${f1.category || ''} ${f1.description || ''}`;
  const text2 = `${f2.title} ${f2.category || ''} ${f2.description || ''}`;

  const concepts1 = extractConcepts(text1);
  const concepts2 = extractConcepts(text2);

  // Check if they share any specific vulnerability concept
  let sharedConcept = false;
  for (const c of concepts1) {
    if (concepts2.has(c)) {
      sharedConcept = true;
      break;
    }
  }

  const tokens1 = tokenize(f1.title + ' ' + (f1.category || ''));
  const tokens2 = tokenize(f2.title + ' ' + (f2.category || ''));
  const titleSim = jaccardSimilarity(tokens1, tokens2);

  // If in the same file:
  // Must share a vulnerability concept OR have significant title similarity (>= 0.35)
  // This explicitly prevents merging "SQL Injection" and "Rate limiting" in the same file!
  if (sameFile) {
    return sharedConcept || titleSim >= 0.35;
  }

  // If files overlap (e.g. "app/main.py" and "app/main.py & app/mobile_api.py")
  if (overlappingFile) {
    return sharedConcept && (titleSim >= 0.15 || f1.category === f2.category);
  }

  // Cross-file matching (e.g. README.md vs LICENSE for licensing issues)
  if (sharedConcept && (concepts1.has('licensing') || concepts1.has('dos_rate_limiting'))) {
    return true;
  }

  // High title similarity fallback across files
  return titleSim >= 0.75;
}

/**
 * Main compiler routine
 */
export function compileReports() {
  console.log('Compiling reports from:', reportsDir);

  if (!fs.existsSync(reportsDir)) {
    console.warn(`Reports directory does not exist: ${reportsDir}`);
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md') && !f.startsWith('.'));
  const reports = [];
  let totalErrors = 0;

  for (const file of files) {
    const fullPath = path.join(reportsDir, file);
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    
    // Sanitize any machine paths in content
    const content = sanitizePaths(rawContent);

    const { metadata, markdown, parseError } = parseMarkdownWithFrontmatter(content);

    if (parseError) {
      console.error(`❌ [${file}] YAML Frontmatter Error: ${parseError}`);
      totalErrors++;
      continue;
    }

    const { isValid, errors, warnings } = validateReport(metadata, file);

    if (warnings.length > 0) {
      warnings.forEach(w => console.warn(`⚠️  [${file}] ${w}`));
    }

    if (!isValid) {
      errors.forEach(e => console.error(`❌ [${file}] ${e}`));
      totalErrors += errors.length;
      if (isStrict) {
        continue;
      }
    }

    const reportId = metadata.model_id || path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const modelName = metadata.model || reportId;

    // Sanitize findings and extract rich attributes
    const securityFindings = (metadata.security_findings || []).map((f, idx) => ({
      id: f.id || `SEC-${reportId}-${idx + 1}`,
      severity: (f.severity || 'MEDIUM').toUpperCase(),
      status: f.status || 'unverified',
      confidence: f.confidence !== undefined && f.confidence !== null ? Number(f.confidence) : 0.8,
      category: f.category || 'general',
      title: f.title || 'Untitled finding',
      file: sanitizePaths(f.file || 'unknown'),
      line_start: f.line_start !== undefined ? Number(f.line_start) : undefined,
      line_end: f.line_end !== undefined ? Number(f.line_end) : undefined,
      affected_function: f.affected_function || undefined,
      description: sanitizePaths(f.description || ''),
      evidence: sanitizePaths(f.evidence || ''),
      impact: f.impact || '',
      recommendation: f.recommendation || '',
      reported_by: modelName,
      model_id: reportId
    }));

    reports.push({
      id: reportId,
      filename: file,
      model: modelName,
      target_repo: metadata.target_repo || 'Target Repository',
      target_commit: metadata.target_commit || '',
      review_date: metadata.review_date || new Date().toISOString().split('T')[0],
      scores: {
        overall: parseScore(metadata.scores?.overall),
        architecture: parseScore(metadata.scores?.architecture),
        code_quality: parseScore(metadata.scores?.code_quality),
        security: parseScore(metadata.scores?.security),
        documentation: parseScore(metadata.scores?.documentation),
      },
      summary: sanitizePaths(metadata.summary || ''),
      key_strengths: (metadata.key_strengths || []).map(s => sanitizePaths(s)),
      key_weaknesses: (metadata.key_weaknesses || []).map(w => sanitizePaths(w)),
      security_findings: securityFindings,
      markdown: markdown
    });
  }

  if (isValidateOnly) {
    if (totalErrors > 0) {
      console.error(`\nValidation completed with ${totalErrors} error(s).`);
      process.exit(1);
    }
    console.log(`\nValidation successful: all ${files.length} report(s) are valid.`);
    return;
  }

  if (isStrict && totalErrors > 0) {
    console.error(`Aborting compilation: ${totalErrors} validation error(s) in strict mode.`);
    process.exit(1);
  }

  // Compute Consensus and Averages without treating missing scores as zero
  const modelCount = reports.length;
  const targetRepoName = reports[0]?.target_repo || 'Target Repository';

  const averageScores = {
    overall: calculateAverage(reports.map(r => r.scores.overall)),
    architecture: calculateAverage(reports.map(r => r.scores.architecture)),
    code_quality: calculateAverage(reports.map(r => r.scores.code_quality)),
    security: calculateAverage(reports.map(r => r.scores.security)),
    documentation: calculateAverage(reports.map(r => r.scores.documentation)),
  };

  // Score comparison table with nullable scores preserved
  const scoreComparison = [
    {
      metric: 'Overall Score',
      key: 'overall',
      average: averageScores.overall,
      ...Object.fromEntries(reports.map(r => [r.id, r.scores.overall]))
    },
    {
      metric: 'Architecture',
      key: 'architecture',
      average: averageScores.architecture,
      ...Object.fromEntries(reports.map(r => [r.id, r.scores.architecture]))
    },
    {
      metric: 'Code Quality',
      key: 'code_quality',
      average: averageScores.code_quality,
      ...Object.fromEntries(reports.map(r => [r.id, r.scores.code_quality]))
    },
    {
      metric: 'Security',
      key: 'security',
      average: averageScores.security,
      ...Object.fromEntries(reports.map(r => [r.id, r.scores.security]))
    },
    {
      metric: 'Documentation',
      key: 'documentation',
      average: averageScores.documentation,
      ...Object.fromEntries(reports.map(r => [r.id, r.scores.documentation]))
    },
  ];

  // Aggregate and cluster security findings with evidence retention
  const allSecurityFindings = [];
  for (const r of reports) {
    for (const finding of r.security_findings) {
      allSecurityFindings.push(finding);
    }
  }

  const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusRank = { verified: 3, probable: 2, unverified: 1 };

  const securityClusters = [];

  for (const finding of allSecurityFindings) {
    let matchedCluster = null;

    for (const cluster of securityClusters) {
      if (areFindingsSimilar(cluster, finding)) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      // Add model name if not already listed
      if (!matchedCluster.reportedByModels.includes(finding.reported_by)) {
        matchedCluster.reportedByModels.push(finding.reported_by);
      }
      // Retain instance as evidence behind cluster
      matchedCluster.instances.push(finding);

      // Upgrade severity to highest among instances
      if ((severityWeight[finding.severity] || 0) > (severityWeight[matchedCluster.severity] || 0)) {
        matchedCluster.severity = finding.severity;
      }
      // Upgrade status if any instance has stronger verification
      if ((statusRank[finding.status] || 0) > (statusRank[matchedCluster.status] || 0)) {
        matchedCluster.status = finding.status;
      }
      // Compute max confidence
      if (finding.confidence && finding.confidence > matchedCluster.confidence) {
        matchedCluster.confidence = finding.confidence;
      }
    } else {
      securityClusters.push({
        id: `CLUSTER-${securityClusters.length + 1}`,
        title: finding.title,
        file: finding.file,
        severity: finding.severity || 'MEDIUM',
        category: finding.category || 'general',
        status: finding.status || 'unverified',
        confidence: finding.confidence || 0.8,
        description: finding.description,
        evidence: finding.evidence || '',
        recommendation: finding.recommendation || '',
        reportedByModels: [finding.reported_by],
        instances: [finding]
      });
    }
  }

  // Sort clusters: CRITICAL > HIGH > MEDIUM > LOW, then by model agreement count
  securityClusters.sort((a, b) => {
    const sevDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (sevDiff !== 0) return sevDiff;
    return b.reportedByModels.length - a.reportedByModels.length;
  });

  const compiledData = {
    updated_at: new Date().toISOString(),
    target_repo: targetRepoName,
    model_count: modelCount,
    models: reports.map(r => ({ id: r.id, name: r.model })),
    average_scores: averageScores,
    score_comparison: scoreComparison,
    security_audit: {
      total_findings: allSecurityFindings.length,
      clusters: securityClusters
    },
    reports: reports
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(compiledData, null, 2), 'utf-8');

  console.log(`✅ Successfully compiled ${reports.length} model report(s) into ${outputFile}`);
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  compileReports();
}
