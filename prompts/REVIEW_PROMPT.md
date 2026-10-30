# AI Repository Review Prompt

Use this standardized prompt when asking an AI model (e.g., Claude, Gemini, GPT-4o, DeepSeek, Llama) to inspect the repository inside the `target/` folder.

---

## Prompt to Copy & Paste to AI Models

```markdown
You are a Principal Software Architect and Application Security Auditor.
Your task is to thoroughly analyze the repository code located in the `target/` folder and generate a comprehensive technical review report.

Please inspect the codebase for:
1. Used Language(s) & Tech Stack (runtimes, frameworks, dependencies, build tools)
2. Project Scope & Architecture (purpose, core functionality, component interactions)
3. Repository Size & Metrics (number of files, lines of code, complexity distribution)
4. Directory Structure & Organization (modularity, separation of concerns, clean architecture)
5. Documentation Quality (README completeness, installation guides, API references, inline docstrings)
6. Security Flaws & Vulnerabilities (secret leaks, injection risks, dependency issues, permission flaws, error handling)
7. Final Assessment & Scorecard (0-10 scores and actionable recommendations)

### Output Format Requirement:
You MUST start your response with a YAML frontmatter block enclosed in `---`, followed by your detailed Markdown report.

---
model: "<Exact Model Name, e.g. Gemini 2.5 Pro / Claude 3.7 Sonnet / GPT-4o>"
model_id: "<kebab-case-id, e.g. gemini-2-5-pro, claude-3-7-sonnet, gpt-4o, deepseek-r1>"
target_repo: "<Repository Name or target>"
review_date: "<YYYY-MM-DD>"
scores:
  overall: <0.0 - 10.0>
  architecture: <0.0 - 10.0>
  code_quality: <0.0 - 10.0>
  security: <0.0 - 10.0>
  documentation: <0.0 - 10.0>
summary: "<2-3 sentence executive summary of the repository assessment>"
key_strengths:
  - "<Strength 1>"
  - "<Strength 2>"
  - "<Strength 3>"
key_weaknesses:
  - "<Weakness 1>"
  - "<Weakness 2>"
  - "<Weakness 3>"
security_findings:
  - severity: "CRITICAL" # CRITICAL | HIGH | MEDIUM | LOW
    title: "<Short title of flaw>"
    file: "<Path or component affected>"
    description: "<Brief explanation of risk>"
  - severity: "HIGH"
    title: "<Short title of flaw>"
    file: "<Path or component affected>"
    description: "<Brief explanation of risk>"
---

# Technical Review Report: [Project Name]

## 1. Executive Summary & Scope
[Detailed explanation of the project's purpose, target audience, and architectural style]

## 2. Languages & Technology Stack
- **Primary Languages**: [Languages and versions]
- **Frameworks & Libraries**: [Key libraries used]
- **Build Tools & Environment**: [Package managers, bundlers, compilers]

## 3. Quantitative Metrics & Code Scope
- **File Counts & Lines of Code**: [Discussion of codebase size and density]
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
   - `reports/gemini-2-5-pro.md`
   - `reports/claude-3-7-sonnet.md`
   - `reports/gpt-4o.md`
   - `reports/deepseek-r1.md`
2. Run `npm run compile-reports` (or `npm run build` / `npm run dev`) to compile the reviews into the Vite dashboard.
