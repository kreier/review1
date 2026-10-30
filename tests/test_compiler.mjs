import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseScore,
  calculateAverage,
  areFindingsSimilar,
  sanitizePaths,
  validateReport
} from '../scripts/compile-reports.js';

test('parseScore handles numbers, null, undefined, and empty string', () => {
  assert.equal(parseScore(8.5), 8.5);
  assert.equal(parseScore('9.0'), 9.0);
  assert.equal(parseScore(0), 0);
  assert.equal(parseScore(null), null);
  assert.equal(parseScore(undefined), null);
  assert.equal(parseScore(''), null);
  assert.equal(parseScore('invalid'), null);
});

test('calculateAverage calculates average only over non-null numbers', () => {
  // If one model gave 8.0, another gave 9.0, and third omitted score (null),
  // average should be (8.0 + 9.0) / 2 = 8.5, NOT (8.0 + 9.0 + 0) / 3 = 5.7!
  const scoresWithMissing = [8.0, 9.0, null];
  assert.equal(calculateAverage(scoresWithMissing), 8.5);

  // All nulls
  assert.equal(calculateAverage([null, null]), null);

  // Normal case
  assert.equal(calculateAverage([8.0, 9.0, 10.0]), 9.0);
});

test('areFindingsSimilar does NOT merge distinct vulnerabilities in the same file', () => {
  const rateLimitFinding = {
    file: 'app/main.py',
    title: 'Missing request rate limiting',
    category: 'availability'
  };

  const sqlInjectionFinding = {
    file: 'app/main.py',
    title: 'SQL injection in query handler',
    category: 'injection'
  };

  const infoDisclosureFinding = {
    file: 'app/main.py',
    title: 'Information disclosure in stack trace',
    category: 'information_disclosure'
  };

  // Ensure these 3 completely different vulnerabilities in app/main.py are NOT merged
  assert.equal(areFindingsSimilar(rateLimitFinding, sqlInjectionFinding), false);
  assert.equal(areFindingsSimilar(rateLimitFinding, infoDisclosureFinding), false);
  assert.equal(areFindingsSimilar(sqlInjectionFinding, infoDisclosureFinding), false);
});

test('areFindingsSimilar merges genuine duplicate findings across models', () => {
  const findingClaude = {
    file: 'app/main.py',
    title: 'Absence of IP Rate Limiting on Public Health and WebRTC Routes',
    description: 'Endpoints are unthrottled, allowing low-effort socket exhaustion attacks.'
  };

  const findingGemini = {
    file: 'app/main.py & app/mobile_api.py',
    title: 'Denial-of-Service Risk via Unthrottled Public Endpoints',
    description: 'Public endpoints lack rate limiting allowing connection flooding.'
  };

  const findingGPT = {
    file: 'app/main.py',
    title: 'Denial of Service Risk on Unauthenticated Routes',
    description: 'WebRTC and health check routes do not enforce rate limiting.'
  };

  assert.equal(areFindingsSimilar(findingClaude, findingGemini), true);
  assert.equal(areFindingsSimilar(findingClaude, findingGPT), true);
  assert.equal(areFindingsSimilar(findingGemini, findingGPT), true);
});

test('sanitizePaths removes local machine absolute paths', () => {
  const rawMarkdown = 'See [Docs](file:///Users/mk/github/review1/target/repo/docs/guide.md) or `/Users/john/repo/test.py`';
  const clean = sanitizePaths(rawMarkdown);
  assert.equal(clean.includes('/Users/mk'), false);
  assert.equal(clean.includes('/Users/john'), false);
  assert.equal(clean.includes('docs/guide.md'), true);
});

test('validateReport validates schema rules', () => {
  const validReport = {
    model: 'Claude 3.7 Sonnet',
    model_id: 'claude-3-7-sonnet',
    target_repo: 'test/repo',
    review_date: '2026-10-30',
    scores: {
      overall: 8.5,
      architecture: 9.0,
      code_quality: 8.0,
      security: 8.0,
      documentation: 9.0
    },
    security_findings: [
      { severity: 'HIGH', title: 'Test Flaw', file: 'app/test.py' }
    ]
  };

  const res = validateReport(validReport, 'test.md');
  assert.equal(res.isValid, true);
  assert.equal(res.errors.length, 0);

  // Invalid report (out of range score & missing model)
  const invalidReport = {
    model_id: 'bad',
    scores: {
      overall: 15.0 // Invalid!
    }
  };

  const badRes = validateReport(invalidReport, 'bad.md');
  assert.equal(badRes.isValid, false);
  assert.ok(badRes.errors.some(e => e.includes('overall')));
  assert.ok(badRes.errors.some(e => e.includes('model')));
});
