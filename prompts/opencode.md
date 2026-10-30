# OpenCode Target Review Prompt

Use this prompt to run **OpenCode** on the target repository located in `target/`.

---

## Instructions for OpenCode

You are acting as an autonomous code reviewer using **OpenCode**.
Your task is to independently audit the codebase located strictly in `target/`.

### Critical Directives:
1. **Target Boundary**: Inspect ONLY the code inside `target/`. Do NOT review the framework files of `review1` (e.g. `src/`, `scripts/`, `package.json`).
2. **Ground Truth Metrics**: Refer to `target-metrics.json` for verified line counts, language distributions, and file inventories.
3. **Investigation Scope**: Evaluate the target codebase across the 15 dimensions defined in `docs/INVESTIGATION_SCOPE.md`.
4. **Output Target**: Save your final analysis to `reports/opencode.md`.

---

## Template to Execute

```markdown
---
model: "OpenCode"
model_id: "opencode"
target_repo: "<Repository Name from target-metrics.json>"
target_commit: "<Target Commit SHA from target-metrics.json>"
review_date: "<YYYY-MM-DD>"
scores:
  overall: <0.0 - 10.0 or null>
  architecture: <0.0 - 10.0 or null>
  code_quality: <0.0 - 10.0 or null>
  security: <0.0 - 10.0 or null>
  documentation: <0.0 - 10.0 or null>
summary: "<Executive summary of the target codebase>"
key_strengths:
  - "<Key technical strength observed in target code>"
  - "<Key technical strength observed in target code>"
key_weaknesses:
  - "<Key limitation, debt, or architectural flaw in target code>"
  - "<Key limitation, debt, or architectural flaw in target code>"
security_findings:
  - id: "SEC-OPENCODE-001"
    severity: "HIGH" # CRITICAL | HIGH | MEDIUM | LOW
    status: "verified" # verified | probable | unverified
    confidence: 0.90
    category: "security"
    title: "<Concise title of finding>"
    file: "<Path relative to target/, e.g. app/routes.py>"
    line_start: <line_number>
    line_end: <line_number>
    affected_function: "<Function or module name>"
    description: "<Clear explanation of the vulnerability or risk>"
    evidence: "<Code excerpt or configuration snippet>"
    impact: "<Potential business or security impact>"
    recommendation: "<Actionable steps to resolve>"
---

# Technical Review: <Target Repository Name>
**Reviewer:** OpenCode  
**Target:** `target/`  

## 1. Executive Summary & Purpose
...

## 2. Technology Stack & Runtimes
...

## 3. Architecture & Modularity
...

## 4. Code Quality & Maintainability
...

## 5. Security & Privacy Posture
...

## 6. Actionable Recommendations
...
```
