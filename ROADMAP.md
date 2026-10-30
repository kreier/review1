# AI Repository Review Hub — Development Roadmap

This roadmap structures the continuous enhancement of the multi-model repository review framework into four progressive phases.

---

## Phase 1 — Reliability & Precision (Completed ✅)
*Target: Establish deterministic baseline, eliminate metrics distortion, ensure schema validation, and sanitize outputs.*

- [x] **Language-Aware LOC Metrics (`analyze-target.py`)**:
  - Distinguish physical lines, blank lines, comments, executable code, documentation, and data lines.
  - Parse multiline and single-line comments across Python, TypeScript/JavaScript, C/C++, Rust, Go, SQL, HTML, etc.
  - Isolate large JSON/SQL data lines from skewing language percentages.
- [x] **Directory Exclusion Granularity**:
  - Categorize exclusions into VCS (`.git`), dependencies (`node_modules`, `vendor`, `.venv`), build artifacts (`dist`, `build`, `out`), and IDE settings.
  - Prevent accidental exclusion of legitimate project source directories (e.g., Rust `target` vs review framework root).
- [x] **Contextual Security Pattern Scanner**:
  - Classify preliminary flags by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and category.
  - Sanitize matched secret strings to avoid storing raw credentials.
- [x] **Target Git Commit Metadata**:
  - Extract target commit SHA, short hash, active branch, author, commit date, and subject.
- [x] **Path & Privacy Sanitization**:
  - Strip local filesystem machine paths (`/Users/...`, `/home/...`) in markdown reports, compiler scripts, and metrics artifacts.
- [x] **Consensus Engine Score Calibration (`compile-reports.js`)**:
  - Treat missing scores as `null` rather than `0.0`.
  - Calculate dimension averages strictly across models that submitted numeric evaluations.
- [x] **Semantic Finding Deduplication**:
  - Prevent conflating distinct vulnerabilities located in the same file (e.g., rate limiting vs SQL injection).
  - Cluster genuine duplicates and retain all original model findings as verifiable evidence instances.
- [x] **Automated Test Suites**:
  - Added Python unit tests (`tests/test_analyzer.py`) verifying line classification, exclusion logic, and sanitization.
  - Added Node.js test runner (`tests/test_compiler.mjs`) testing parsing, averages, similarity grouping, and schema validation.
- [x] **GitHub Actions Workflow Hardening (`deploy.yml`)**:
  - Upgraded to Node.js 22 LTS.
  - Enforce analyzer failure halting: distinguish missing target from failed analysis (no unconditional `|| true`).
  - Added automated test and report validation stages before deployment.

---

## Phase 2 — Extended Investigation Capabilities (Current 🚧)
*Target: Expand automated collectors with static analysis, dependency vulnerability scanning, and API inventories.*

- [ ] **Dependency & Software Bill of Materials (SBOM)**:
  - Integrate `osv-scanner` or `syft` to detect known CVEs in `requirements.txt`, `package.json`, and `Cargo.lock`.
  - Check dependency licensing compatibility (e.g. detect non-commercial licenses).
- [ ] **Automated Static Code Analysis Hooks**:
  - Auto-invoke linters based on detected tech stack (e.g. `ruff` for Python, `eslint` for TypeScript, `cargo clippy` for Rust).
- [ ] **API Inventory Generator**:
  - Automatically parse FastAPI routes, Express/Nest routes, or OpenAPI specifications to inventory endpoints, methods, and auth gates.
- [ ] **Architecture & Internal Dependency Graph**:
  - Generate module import graph (e.g., circular dependency detection between internal modules).

---

## Phase 3 — AI Multi-Model Investigation Pipeline 📋
*Target: Transition from a single master prompt to a modular, multi-stage investigation pipeline.*

- [ ] **Investigation Profiles**:
  - Provide specialized prompt profiles (e.g., *Security & Penetration Audit*, *Mobile & Embedded Architecture*, *Full-Stack Web App*, *Python Packaging*).
- [ ] **Cross-Model Adversarial Verification**:
  - Feed findings from Model A to Model B to challenge assumptions, falsify phantom vulnerabilities, and confirm true positives.
- [ ] **Local Model Exploration (Ollama / Local LLMs)**:
  - Utilize local lightweight models (e.g. Qwen 2.5 Coder, DeepSeek) to map the codebase inventory and generate preliminary summaries without cloud API costs.
- [ ] **Consolidated Technical Debt & Effort Estimation**:
  - Synthesize consensus recommendations into actionable engineering sprints with estimated effort (Story Points / Hours).

---

## Phase 4 — Dashboard Evolution & Repository History 🚀
*Target: Turn the review dashboard into an interactive historical engineering workbench.*

- [ ] **Target Evolution & Commit History**:
  - Store analysis snapshots under `history/<commit-sha>/` to compare review trends over time (e.g., scores change from commit A to commit B).
- [ ] **Evidence Browser UI**:
  - Click any security finding to inspect the exact source code snippet, line references, and all models that reported it.
- [ ] **Model Reliability & Agreement Index**:
  - Track individual AI model accuracy, false positive rate, and unique findings discovered.
- [ ] **Exportable Audits**:
  - Download complete audit report as standalone PDF or single-file Markdown bundle.
