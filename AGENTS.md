# AGENTS.md — AI Agent Operating Instructions & Boundary Guardrails

Welcome, AI Agent (OpenCode, Qoder, Gemini, Claude, DeepSeek, or other autonomous coding assistants).

This file defines the **inviolable boundaries, operating protocols, and execution workflows** for analyzing code within this repository. Read and follow these directives strictly.

---

## 🛑 1. Core Architectural Boundary: The "Review Harness" Law

> **MANDATORY DIRECTIVE:**  
> **`review1` is the REVIEW HARNESS and TOOLING platform.**  
> **`review1` is NEVER the subject of review.**

### The Target Is Always in `target/`
- The codebase to inspect, analyze, evaluate, and review is **EXCLUSIVELY** the external project located in the `target/` directory (e.g. `target/` or `target/<subfolder>`).
- **NEVER** inspect, audit, or review the files of the `review1` framework itself (`src/`, `scripts/`, `tests/`, `package.json`, root `README.md`, etc.) as if they were the target codebase.
- **NEVER** write a report evaluating `review1` into `reports/`.
- If an external model review was run on `review1` instead of `target/`, that review is **invalid** and must be discarded.
- In all report files (`reports/*.md`), `target_repo` must be the name of the external codebase in `target/`, and `target_commit` must match the Git commit of `target/` recorded in `target-metrics.json`.

### Zero-Hallucination Policy
- **NEVER** fabricate, simulate, or hallucinate reports for models that have not been executed.
- If only one model has run (e.g., Gemini 3.8 Flash), `reports/` must only contain that single report.
- The framework handles single-model reviews gracefully without needing placeholder models.

---

## 🔄 2. Complete End-to-End Workflow

```
1. Clone Target ──► 2. Run Analyzer ──► 3. Run AI Reviewers ──► 4. Compile Consensus ──► 5. View Dashboard
   git clone ...       npm run analyze     OpenCode / Qoder        npm run compile-reports  npm run dev / build
   into target/        (analyze-target.py) writes reports/*.md     (compile-reports.js)     (Vite / React)
```

### Step 1: Target Ingestion
Clone the external repository to be audited into `target/`:
```bash
# Direct clone
git clone https://github.com/<owner>/<repo>.git target
# Or as a named subfolder:
git clone https://github.com/<owner>/<repo>.git target/my-app
```

### Step 2: Deterministic Metrics Extraction
Run the automated Python analyzer to extract ground-truth metrics:
```bash
npm run analyze
# Or:
python3 scripts/analyze-target.py target
```
This populates `target-metrics.json` and `src/data/target-metrics.json` with language-classified lines of code (code, comments, blanks, docs, data), test suite inventory, and preliminary security flags.

---

## 🤖 3. Instructions for Running OpenCode & Qoder

### Running OpenCode
**Goal:** Generate an independent, thorough review of the codebase in `target/` and save the result to `reports/opencode.md`.

**Instructions to give OpenCode:**
```
Analyze the target repository located in `target/` using deterministic metrics from `target-metrics.json`.
Do NOT review the review1 framework files. Inspect ONLY the codebase inside `target/`.
Follow the 15 investigation dimensions described in `docs/INVESTIGATION_SCOPE.md` and the master prompt in `prompts/REVIEW_PROMPT.md`.
Output a valid Markdown report with YAML frontmatter adhering to `schemas/report.schema.json` and save it to `reports/opencode.md`.
```

**Required YAML Frontmatter for OpenCode (`reports/opencode.md`):**
```yaml
---
model: "OpenCode"
model_id: "opencode"
target_repo: "<Target Repository Name from target-metrics.json>"
target_commit: "<Target Git SHA from target-metrics.json>"
review_date: "<YYYY-MM-DD>"
scores:
  overall: 8.5        # 0.0 - 10.0 or null
  architecture: 9.0   # 0.0 - 10.0 or null
  code_quality: 8.5   # 0.0 - 10.0 or null
  security: 8.0       # 0.0 - 10.0 or null
  documentation: 7.5  # 0.0 - 10.0 or null
summary: "<Executive summary of target codebase assessment>"
key_strengths:
  - "<Strength 1 observed in target/>"
  - "<Strength 2 observed in target/>"
key_weaknesses:
  - "<Weakness 1 observed in target/>"
  - "<Weakness 2 observed in target/>"
security_findings:
  - id: "SEC-OPENCODE-001"
    severity: "HIGH" # CRITICAL | HIGH | MEDIUM | LOW
    status: "verified" # verified | probable | unverified
    confidence: 0.90
    category: "injection"
    title: "<Finding Title>"
    file: "<target-relative path, e.g. app/routes.py>"
    line_start: 42
    line_end: 55
    affected_function: "<function_name>"
    description: "<Description of vulnerability or architectural flaw>"
    evidence: "<Code excerpt or configuration snippet from target/>"
    impact: "<Potential business or operational impact>"
    recommendation: "<Actionable remediation advice>"
---

# Technical Review: <Target Repository Name>
... detailed markdown analysis across the 15 dimensions ...
```

---

### Running Qoder
**Goal:** Generate an independent review from Qoder evaluating the codebase in `target/` and save the result to `reports/qoder.md`.

**Instructions to give Qoder:**
```
Analyze the target repository located in `target/` using deterministic metrics from `target-metrics.json`.
Do NOT review the review1 framework files. Inspect ONLY the codebase inside `target/`.
Follow the 15 investigation dimensions described in `docs/INVESTIGATION_SCOPE.md` and the master prompt in `prompts/REVIEW_PROMPT.md`.
Output a valid Markdown report with YAML frontmatter adhering to `schemas/report.schema.json` and save it to `reports/qoder.md`.
```

**Required YAML Frontmatter for Qoder (`reports/qoder.md`):**
```yaml
---
model: "Qoder"
model_id: "qoder"
target_repo: "<Target Repository Name from target-metrics.json>"
target_commit: "<Target Git SHA from target-metrics.json>"
review_date: "<YYYY-MM-DD>"
scores:
  overall: 8.2
  architecture: 8.8
  code_quality: 8.6
  security: 8.1
  documentation: 7.2
summary: "<Executive summary of target codebase assessment>"
key_strengths:
  - "<Strength 1 observed in target/>"
  - "<Strength 2 observed in target/>"
key_weaknesses:
  - "<Weakness 1 observed in target/>"
  - "<Weakness 2 observed in target/>"
security_findings:
  - id: "SEC-QODER-001"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.88
    category: "availability"
    title: "<Finding Title>"
    file: "<target-relative path, e.g. app/mobile_api.py>"
    line_start: 35
    line_end: 60
    description: "<Description>"
    evidence: "<Code excerpt>"
    recommendation: "<Actionable remediation>"
---

# Technical Review: <Target Repository Name>
... detailed markdown analysis across the 15 dimensions ...
```

---

## 📊 4. Compiling the Multi-Model Consensus Summary

Once one or more model reports exist in `reports/` (e.g., `gemini-3-8-flash.md`, `opencode.md`, `qoder.md`):

Run the compiler:
```bash
npm run compile-reports
```

### What the compiler does automatically:
1. **Validates Each Report**: Checks required frontmatter fields (`model`, `model_id`, `target_repo`, `review_date`, `scores`) against `schemas/report.schema.json`.
2. **Enforces Boundary Checks**: Automatically rejects any report attempting to review `review1` itself.
3. **Validates Target Consistency**: Verifies that all reports target the exact same repository.
4. **Calculates Fair Consensus**: Averages scores across models, preserving `null` for unassessed dimensions so missing scores never drag down composite averages.
5. **Clusters Security Findings**: Semantically deduplicates findings across models using concept and token Jaccard similarity, aggregating multi-model agreement while preserving every original model quote as evidence.
6. **Produces Web Artifact**: Writes `src/data/reports.json` consumed by the live React/Vite dashboard.

---

## 🧪 5. Verification & Quality Gates

Before committing any changes or reports:
```bash
# 1. Validate all reports in reports/*.md against schema
npm run validate-reports

# 2. Run all unit tests (Node.js compiler tests + Python analyzer tests + TypeScript typecheck)
npm run test:all

# 3. Build the production dashboard bundle
npm run build
```

---

## 📋 6. Summary Checklist for Agents

| Check | Requirement |
|---|---|
| **Target Location** | Analyzed code is inside `target/` only |
| **Framework Separation** | Did NOT analyze or review files in `review1` (`src/`, `scripts/`, etc.) |
| **Output Location** | Saved report to `reports/<model_id>.md` |
| **Frontmatter** | Formatted per `schemas/report.schema.json` with `target_repo`, `review_date`, `scores` |
| **Paths** | Relative paths within `target/` only (no absolute machine paths) |
| **Integrity** | No fabricated or simulated reports for unexecuted models |
| **Validation** | Ran `npm run validate-reports` and `npm test` successfully |
