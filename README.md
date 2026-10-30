# review1 🔍🤖

> **Multi-Model AI Code Review, Static Analysis & Security Audit Framework**  
> Clone any target repository, extract deterministic quantitative metrics, prompt multiple frontier AI models across 15 standard investigation dimensions, synthesize consensus, and publish an interactive report dashboard on **GitHub Pages**.

🌐 **Live Dashboard**: [https://kreier.github.io/review1/](https://kreier.github.io/review1/)

---

## 🏛️ The Four-Layer Architecture

The framework decouples deterministic code ground truth from AI qualitative reasoning:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        4. Presentation Layer                           │
│     Interactive Vite/React Dashboard • GitHub Pages • Exportable JSON   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ consumes
┌───────────────────────────────────┴────────────────────────────────────┐
│                        3. Intelligence Layer                           │
│   Multi-Model AI Reviews (Claude, Gemini, GPT) • Consensus Engine      │
│   Evidence Clustering • Cross-Model Verification • Confidence Scoring  │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ informed by
┌───────────────────────────────────┴────────────────────────────────────┐
│                         2. Analyzer Layer                              │
│   Deterministic Line Classification • Heuristic Security Scanner       │
│   Test Suite Detection • Dependency/Configuration Inventory            │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ extracts from
┌───────────────────────────────────┴────────────────────────────────────┐
│                        1. Collector Layer                              │
│   Target File Hierarchy • Git Commit Metadata • Language Detection     │
│   Directory Exclusion & Safe Path Sanitization                         │
└────────────────────────────────────────────────────────────────────────┘
```

Detailed architectural documentation & agent rules:
- 🤖 [**AI Agent Operating Instructions & Guardrails (`AGENTS.md`)**](./AGENTS.md)
- 📖 [**Architecture & Data Flow (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md)
- 📋 [**15 Investigation Dimensions (`docs/INVESTIGATION_SCOPE.md`)**](./docs/INVESTIGATION_SCOPE.md)
- 📑 [**Standardized Report Schema & Evidence Rubrics (`docs/REPORT_SCHEMA.md`)**](./docs/REPORT_SCHEMA.md)
- 🗺️ [**Development Roadmap (`ROADMAP.md`)**](./ROADMAP.md)

---

## 🚀 Key Improvements & Features

- **Language-Aware Line Metrics**: Accurately classifies lines into **executable code**, **language-specific comments**, **blank lines**, **documentation lines**, and **data lines** (JSON/SQL), preventing data files from skewing language distribution.
- **Evidence-Preserving Deduplication**: Security findings across models are grouped by composite semantic criteria (file path, vulnerability category, title tokens) rather than raw file matching. Prevents conflating distinct flaws (e.g. rate limiting vs SQL injection) while retaining all original model quotes as evidence instances.
- **Fair Consensus Averages**: Missing review scores are preserved as `null` rather than defaulted to `0.0`, computing true dimension averages.
- **Target Git Revision Tracking**: Automatically extracts commit SHA, active branch, author, date, and commit message from the target repository.
- **Privacy & Path Sanitization**: Prevents local machine paths (`/Users/...`, `/home/...`) and raw credentials from leaking into published reports.
- **Rigorous Test Suite**: Automated Python unit tests (`tests/test_analyzer.py`), Node.js test runner (`tests/test_compiler.mjs`), and strict JSON Schema validation (`schemas/`).

---

## 🛠️ Step-by-Step Workflow

### Step 1: Clone Target Repository into `target/`

Clone the codebase you want to investigate into the `target` folder:

```bash
# Clone target repository
git clone https://github.com/<owner>/<repo>.git target
```

> **Safety Guarantee**: The `.gitignore` is pre-configured to ignore `/target/*`, keeping the target repository's source code and `.git` history strictly isolated from the review repository.

---

### Step 2: Run Automated Repository Analysis

Extract quantitative metrics, language distribution, file counts, documentation files, and structure:

```bash
npm run analyze
# Or directly:
python3 scripts/analyze-target.py target
```

This generates:
- Terminal summary with physical, code, comment, blank, doc, and data line breakdowns.
- `target-metrics.json` (adhering to `schemas/analysis.schema.json`)
- `src/data/target-metrics.json` (consumed by the Vite web application)

---

### Step 3: Prompt AI Models & Autonomous Agents

Use the master prompt or specialized prompts to evaluate the code in `target/`:
- 🌟 Master Prompt: [`prompts/REVIEW_PROMPT.md`](./prompts/REVIEW_PROMPT.md)
- 🤖 OpenCode Review Guide: [`prompts/opencode.md`](./prompts/opencode.md)
- ⚡ Qoder Review Guide: [`prompts/qoder.md`](./prompts/qoder.md)
- 🏛️ Architecture & Modularity: [`prompts/architecture.md`](./prompts/architecture.md)
- 🛡️ Security & Supply Chain: [`prompts/security.md`](./prompts/security.md)
- 🧪 Code Quality & Testing: [`prompts/code-quality.md`](./prompts/code-quality.md)
- 📖 Onboarding & Documentation Reality: [`prompts/documentation.md`](./prompts/documentation.md)

Feed your target codebase context to different frontier AI models and autonomous tools:
- **OpenCode** (Autonomous agent / CLI code review)
- **Qoder** (Agentic repository auditor)
- **Gemini 3.8 Flash** (Google)
- **Claude 3.7 Sonnet** (Anthropic)
- **DeepSeek R1 / Llama 3 / Ollama** (Open weights / local)

> ⚠️ **Critical Rule**: AI models must review the code in `target/`, NOT `review1` itself. See [`AGENTS.md`](./AGENTS.md) for strict boundaries.

---

### Step 4: Save Model Reports into `reports/`

Save each AI model's response as a `.md` file in `reports/`:
- `reports/gemini-3-8-flash.md` (Gemini review of `target/`)
- `reports/opencode.md` (OpenCode review of `target/`)
- `reports/qoder.md` (Qoder review of `target/`)

> **Integrity & Real Reviews Guarantee**: Only verified, authentically executed model reviews are stored in `reports/`. Never commit simulated or hallucinated model outputs.

#### Report Frontmatter Format
```yaml
---
model: "OpenCode"
model_id: "opencode"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-30"
scores:
  overall: 8.5
  architecture: 9.0
  code_quality: 8.7
  security: 8.2
  documentation: 7.5
summary: "An exemplary assistive engineering project..."
key_strengths:
  - "Rigorous state machine modeling in mobile client"
  - "Local edge speech recognition protects microphone privacy"
key_weaknesses:
  - "In-memory admission control prevents horizontal scaling"
security_findings:
  - id: "SEC-001"
    severity: "HIGH" # CRITICAL | HIGH | MEDIUM | LOW
    status: "verified"  # verified | probable | unverified
    confidence: 0.95
    category: "availability"
    title: "Absence of IP Rate Limiting on Public Health and WebRTC Routes"
    file: "app/main.py"
    line_start: 35
    line_end: 78
    description: "Public health check and WebRTC negotiation endpoints are unthrottled..."
    evidence: "FastAPI route definitions do not apply rate limiting middleware."
    recommendation: "Deploy a reverse proxy (e.g. Caddy) or attach slowapi middleware."
---
```
    status: "verified"  # verified | probable | unverified
    confidence: 0.95
    category: "availability"
    title: "Absence of IP Rate Limiting on Public Health and WebRTC Routes"
    file: "app/main.py"
    line_start: 35
    line_end: 78
    affected_function: "health_check & webrtc_offer"
    description: "Public health check and WebRTC negotiation endpoints are unthrottled."
    evidence: "FastAPI route definitions do not apply rate limiting middleware."
    recommendation: "Deploy a reverse proxy with rate limiting or slowapi middleware."
---

# Technical Review Report
...
```

---

### Step 5: Validate, Test Locally & Deploy to GitHub Pages

#### Run Automated Tests & Validation:
```bash
npm run test:all
```
This runs:
- `npm test`: Node.js tests for score parsing, non-zero averages, deduplication, and schema validation
- `npm run test:python`: Python tests for line counting, comments, directory exclusion, and secret masking
- `npm run typecheck`: TypeScript strict compilation check

#### Run Dev Server Locally:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) to explore the interactive dashboard.

#### Build Production Bundle:
```bash
npm run build
```

#### Publish to GitHub Pages:
Simply commit your changes and push to `main`:
```bash
git add .
git commit -m "feat: enhance analysis metrics, test suites, and report compiler"
git push origin main
```
The GitHub Actions workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) will run all unit tests, validate schemas, analyze the target repo, and publish the static bundle to GitHub Pages.

---

## 💻 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Compiles reports and starts local Vite development server |
| `npm test` | Runs compiler, deduplication, and schema tests (`node --test`) |
| `npm run test:python` | Runs Python unit tests for `analyze-target.py` |
| `npm run test:all` | Runs all tests (Node, Python, and TypeScript typecheck) |
| `npm run validate-reports` | Validates all markdown reports in `reports/` against schema |
| `npm run typecheck` | Validates TypeScript types across the project (`tsc --noEmit`) |
| `npm run build` | Validates reports with `--strict`, compiles reports, and builds Vite bundle |
| `npm run preview` | Previews the production build locally |
| `npm run analyze` | Runs Python target repo scanner (`scripts/analyze-target.py`) |
| `npm run compile-reports` | Parses `reports/*.md` and generates `src/data/reports.json` |

---

## 📄 License
Apache License 2.0 (see [LICENSE](./LICENSE))
