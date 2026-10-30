# AI Repository Review Master Prompt

Use this standardized prompt when asking an AI model (e.g., OpenCode, Qoder, Gemini 3.8 Flash, Claude 3.7 Sonnet, DeepSeek-R1) to inspect the repository inside the `target/` folder.

---

## Instructions for Reviewers

1. **Deterministic Ground Truth**: Do not guess file counts or lines of code. Always consult `target-metrics.json` (produced by `python3 scripts/analyze-target.py target`) for exact numbers.
2. **Relative Paths Only**: Always use repository-relative paths (e.g., `app/main.py`, `docs/ARCH.md`). Never include local machine or absolute paths (`/Users/...`, `/home/...`).
3. **Evidence Requirement**: Ground all security and architectural observations in actual code snippets and line numbers. Classify each finding as `verified` (confirmed code evidence), `probable` (likely risk depending on environment), or `unverified` (design observation).

---

## Prompt to Copy & Paste to AI Models

```markdown
You are a Principal Software Architect and Application Security Auditor.
Your task is to thoroughly analyze the repository code located in the `target/` folder and generate a comprehensive technical review report.

Please inspect the codebase across the 15 standard investigation dimensions:
1. Project Identity & Purpose (problem domain, target audience, aspirational claims vs actual operational code)
2. Technology Stack & Runtimes (languages, frameworks, build tools, declared vs used)
3. Quantitative Scope & Metrics (refer to deterministic metrics from target-metrics.json)
4. Repository Structure & Architecture (layers, modularity, client-server topology, entry points, design patterns)
5. Code Quality & Maintainability (typing discipline, complexity, naming, dead code)
6. Dependencies & Supply Chain (pinning, known CVEs, outdated packages)
7. Testing & Quality Assurance (unit/integration suites, coverage, mocking hygiene)
8. Security Posture (secrets, injection, rate limiting, auth, data privacy, local vs cloud processing boundaries)
9. API & Interfaces (REST/WebSocket endpoints, schema validation boundaries, media pipeline classifications)
10. Data Persistence & State (migrations, local storage, persistence durability)
11. Performance & Concurrency (async loops, thread pools, admission gates)
12. Deployment & Containerization (Docker purpose and topology, unprivileged users, environment variables)
13. Documentation & Onboarding Integrity (root README clarity, entry point disambiguation, version progression delta)
14. Licensing & Legal Compliance (root license, third-party model weights / assets)
15. Actionable Roadmap (prioritized short-term and medium-term recommendations)

### Mandatory Architectural Disambiguation Requirements:
Your report must explicitly address and disambiguate:
- **Deployment & Artifact Roles**: Why do containers (e.g., Dockerfile) exist? What is the client vs backend vs cloud distribution?
- **Media Pipeline & Modality**: Is video continuous streaming or snapshot-based? Is audio input (STT) or output (TTS)? Where do models run (locally on CPU vs cloud API)?
- **Version Milestone Delta**: If releases exist (e.g. v0.2, v0.3, v0.4), what changed between them functionally and architecturally?
- **Onboarding / "Front-Door" Reality Check**: Does the root README represent the actual operational codebase, or does it mislead with local prototypes or unintegrated hardware references?

### Output Format Requirement:
You MUST start your response with a YAML frontmatter block enclosed in `---`, followed by your detailed Markdown report.

---
model: "<Exact Model Name, e.g. OpenCode / Qoder / Gemini 3.8 Flash / Claude 3.7 Sonnet>"
model_id: "<kebab-case-id, e.g. opencode, qoder, gemini-3-8-flash, claude-3-7-sonnet>"
target_repo: "<Repository Name>"
target_commit: "<Target Git Commit SHA from target-metrics.json if available>"
review_date: "<YYYY-MM-DD>"
scores:
  overall: <0.0 - 10.0 or null>
  architecture: <0.0 - 10.0 or null>
  code_quality: <0.0 - 10.0 or null>
  security: <0.0 - 10.0 or null>
  documentation: <0.0 - 10.0 or null>
summary: "<2-3 sentence executive synopsis of the repository assessment>"
key_strengths:
  - "<Key technical strength 1>"
  - "<Key technical strength 2>"
  - "<Key technical strength 3>"
key_weaknesses:
  - "<Key weakness or limitation 1>"
  - "<Key weakness or limitation 2>"
  - "<Key weakness or limitation 3>"
security_findings:
  - id: "SEC-001"
    severity: "HIGH" # CRITICAL | HIGH | MEDIUM | LOW
    status: "verified" # verified | probable | unverified
    confidence: 0.95 # 0.0 to 1.0
    category: "availability" # credentials | injection | availability | persistence | licensing | network
    title: "<Short, descriptive title of vulnerability>"
    file: "<Repository-relative path, e.g. app/main.py>"
    line_start: 120
    line_end: 145
    affected_function: "<Name of function or component>"
    description: "<Clear explanation of the flaw and its mechanism>"
    evidence: "<Code snippet or configuration line proving the finding>"
    impact: "<Concrete consequence if exploited>"
    recommendation: "<Specific remediation steps and code changes>"
---

# Technical Review Report: [Project Name]

## 1. Executive Summary & Scope
[Detailed explanation of the project's purpose, target audience, and architectural style]

## 2. Languages & Technology Stack
- **Primary Languages**: [Languages and versions]
- **Frameworks & Libraries**: [Key libraries used]
- **Build Tools & Environment**: [Package managers, bundlers, compilers]

## 3. Quantitative Metrics & Code Scope
- **File Counts & Lines of Code**: [Discussion of codebase size, executable lines vs data]
- **Complexity Assessment**: [High vs low complexity components]
- **Test Coverage & Quality**: [Presence, nature, and thoroughness of unit/integration tests]

## 4. Repository Structure & Architecture
- **Directory Layout**: [Breakdown of directories and responsibility boundaries]
- **Design Patterns**: [Identified patterns, modularity, adherence to SOLID/DRY]
- **Maintainability**: [Coupling, cohesion, technical debt observations]

## 5. Documentation Assessment
- **Setup & Getting Started**: [Clarity of onboarding, local development, prerequisites]
- **API & Architecture Docs**: [Presence of architecture diagrams, schemas, API specifications]
- **Code Comments**: [Quality of inline docstrings, type annotations]

## 6. Security & Vulnerability Analysis
- **Critical & High Risks**: [Detailed walkthrough of vulnerabilities found]
- **Attack Surface Analysis**: [Input validation, authentication, authorization, data privacy]
- **Secrets & Credentials Management**: [Evaluation of hardcoded tokens, env handling]
- **Dependency & Supply Chain Risks**: [Outdated packages, unpinned versions]

## 7. Actionable Recommendations & Roadmap
1. [Priority 1 action]
2. [Priority 2 action]
3. [Priority 3 action]
```

---

## How to Save the Report

1. Save each model's output as a Markdown file in the `reports/` folder:
   - `reports/gemini-3-8-flash.md`
   - `reports/claude-3-7-sonnet.md`
   - `reports/gpt-4o.md`
   - `reports/deepseek-r1.md`
2. Run `npm test` to validate syntax and schema adherence.
3. Run `npm run compile-reports` (or `npm run build` / `npm run dev`) to compile the reviews into the Vite dashboard.
