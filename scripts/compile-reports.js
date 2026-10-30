#!/usr/bin/env node
/**
 * Reports Compiler Script
 * Parses markdown reports in `reports/*.md`, extracts YAML frontmatter,
 * computes synthesis & cross-model consensus, and generates `src/data/reports.json`.
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

function parseMarkdownWithFrontmatter(content) {
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
    console.error('Error parsing YAML frontmatter:', e.message);
    return { metadata: {}, markdown: content };
  }
}

function compileReports() {
  console.log('Compiling reports from:', reportsDir);

  if (!fs.existsSync(reportsDir)) {
    console.warn(`Reports directory does not exist: ${reportsDir}`);
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md') && !f.startsWith('.'));
  const reports = [];

  for (const file of files) {
    const fullPath = path.join(reportsDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { metadata, markdown } = parseMarkdownWithFrontmatter(content);

    const reportId = metadata.model_id || path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const modelName = metadata.model || reportId;

    reports.push({
      id: reportId,
      filename: file,
      model: modelName,
      target_repo: metadata.target_repo || 'Target Repository',
      review_date: metadata.review_date || new Date().toISOString().split('T')[0],
      scores: {
        overall: Number(metadata.scores?.overall) || 0,
        architecture: Number(metadata.scores?.architecture) || 0,
        code_quality: Number(metadata.scores?.code_quality) || 0,
        security: Number(metadata.scores?.security) || 0,
        documentation: Number(metadata.scores?.documentation) || 0,
      },
      summary: metadata.summary || '',
      key_strengths: metadata.key_strengths || [],
      key_weaknesses: metadata.key_weaknesses || [],
      security_findings: metadata.security_findings || [],
      markdown: markdown
    });
  }

  // Generate Synthesis and Consensus
  const modelCount = reports.length;
  let targetRepoName = reports[0]?.target_repo || 'Target Repository';

  const averageScores = {
    overall: 0,
    architecture: 0,
    code_quality: 0,
    security: 0,
    documentation: 0,
  };

  if (modelCount > 0) {
    for (const r of reports) {
      averageScores.overall += r.scores.overall;
      averageScores.architecture += r.scores.architecture;
      averageScores.code_quality += r.scores.code_quality;
      averageScores.security += r.scores.security;
      averageScores.documentation += r.scores.documentation;
    }
    for (const key of Object.keys(averageScores)) {
      averageScores[key] = Number((averageScores[key] / modelCount).toFixed(1));
    }
  }

  // Score comparison table data for chart/tables
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

  // Aggregate security findings
  const allSecurityFindings = [];
  for (const r of reports) {
    for (const finding of r.security_findings) {
      allSecurityFindings.push({
        ...finding,
        reportedBy: r.model,
        modelId: r.id
      });
    }
  }

  // Cluster security findings roughly by title or file
  const securityClusters = [];
  for (const f of allSecurityFindings) {
    const existing = securityClusters.find(c => 
      c.file.toLowerCase() === f.file.toLowerCase() ||
      c.title.toLowerCase().includes(f.title.toLowerCase().slice(0, 15)) ||
      f.title.toLowerCase().includes(c.title.toLowerCase().slice(0, 15))
    );

    if (existing) {
      if (!existing.reportedByModels.includes(f.reportedBy)) {
        existing.reportedByModels.push(f.reportedBy);
      }
      if (f.severity === 'CRITICAL' || (f.severity === 'HIGH' && existing.severity !== 'CRITICAL')) {
        existing.severity = f.severity;
      }
    } else {
      securityClusters.push({
        title: f.title,
        file: f.file,
        severity: f.severity || 'MEDIUM',
        description: f.description,
        reportedByModels: [f.reportedBy]
      });
    }
  }

  // Sort clusters by severity: CRITICAL > HIGH > MEDIUM > LOW
  const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  securityClusters.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));

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

  console.log(`Successfully compiled ${reports.length} model report(s) into ${outputFile}`);
}

compileReports();
