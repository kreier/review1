# review1 🔍🤖

> **Multi-Model AI Code Review & Security Audit Framework**  
> Clone any target repository, have multiple AI models investigate and review it (languages, scope, file counts, architecture, documentation, security flaws), and automatically publish an interactive report dashboard on **GitHub Pages**.

🌐 **Live Dashboard**: [https://kreier.github.io/review1/](https://kreier.github.io/review1/)

---

## 🚀 How It Works

```
┌─────────────────────────┐
│  Target Repository      │ ──> Cloned into target/ (isolated, git-ignored)
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ 1. scripts/analyze-target│ ──> Extracts lines of code, languages, file counts, structure
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ 2. prompts/REVIEW_PROMPT│ ──> Prompts AI models (Claude, Gemini, GPT-4o, DeepSeek, etc.)
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ 3. reports/*.md         │ ──> Markdown reports with YAML scorecards & security audits
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ 4. Vite React Website   │ ──> Interactive dashboard with model comparison & consensus
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ 5. GitHub Pages (CI/CD) │ ──> Automatically built and published on every git push
└─────────────────────────┘
```

---

## 🛠️ Step-by-Step Workflow

### Step 1: Clone Target Repository into `target/`

Clone the codebase you want to investigate into the `target` folder:

```bash
# Option A: Clean clone directly into target
git clone https://github.com/<owner>/<repo>.git target-temp
mv target-temp/* target/ 2>/dev/null
mv target-temp/.* target/ 2>/dev/null
rm -rf target-temp

# Option B: Delete placeholder target folder and clone directly
rm -rf target && git clone https://github.com/<owner>/<repo>.git target
```

> **Safety Guarantee**: The `.gitignore` is pre-configured to ignore `/target/*`, keeping the target repository's files and `.git` history strictly isolated from the review repository.

---

### Step 2: Run Automated Repository Analysis

Extract quantitative metrics, language distribution, file counts, documentation files, and structure:

```bash
npm run analyze
# Or directly:
python3 scripts/analyze-target.py target
```

This generates:
- Terminal overview (lines of code, file counts, language percentages)
- `target-metrics.json`
- `src/data/target-metrics.json` (consumed by the Vite web application)

---

### Step 3: Prompt AI Models

Use the standardized prompt template located in:
👉 [`prompts/REVIEW_PROMPT.md`](./prompts/REVIEW_PROMPT.md)

Feed your target codebase context and the prompt to different frontier AI models:
- **Claude 3.7 Sonnet**
- **Gemini 3.8 Flash**
- **GPT-4o**
- **DeepSeek R1 / Llama 3**

Each model investigates:
1. **Used Languages & Tech Stack**
2. **Project Scope & Architecture**
3. **Repository Size & File Metrics**
4. **Directory Structure & Modularity**
5. **Documentation Completeness**
6. **Security Flaws & Vulnerabilities** (Critical, High, Medium, Low)
7. **Scorecard (0–10)**

---

### Step 4: Save Model Reports into `reports/`

Save each AI model's response as a `.md` file in `reports/`:
- `reports/claude-3-7-sonnet.md`
- `reports/gemini-3-8-flash.md`
- `reports/gpt-4o.md`
- `reports/deepseek-r1.md`

#### Report Frontmatter Format
```yaml
---
model: "Gemini 2.5 Pro"
model_id: "gemini-2-5-pro"
target_repo: "My Awesome Project"
review_date: "2026-10-30"
scores:
  overall: 8.5
  architecture: 8.8
  code_quality: 8.4
  security: 7.9
  documentation: 9.0
summary: "A robust and modular architecture with minor security gaps in auth..."
key_strengths:
  - "Clear domain-driven layer separation"
key_weaknesses:
  - "Lacks token rate-limiting"
security_findings:
  - severity: "HIGH" # CRITICAL | HIGH | MEDIUM | LOW
    title: "Unpinned Cryptographic Algorithm in JWT Verification"
    file: "src/auth/tokens.py"
    description: "JWT decoding routine accepts algorithm from header without validation."
---

# Technical Review Report
...
```

---

### Step 5: Test Locally & Deploy to GitHub Pages

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
git commit -m "feat: update target repository review"
git push origin main
```
The GitHub Actions workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) will automatically build the site and deploy it to GitHub Pages.

> **Note on GitHub Pages Setup**:
> Ensure that your GitHub repository settings under **Settings > Pages > Build and deployment > Source** is set to **GitHub Actions**.

---

## 📊 Features of the Review Website

- **Consensus Scorecard**: Cross-model averages for Overall, Architecture, Code Quality, Security, and Documentation.
- **Score Matrix**: Side-by-side comparison table of all participating AI models.
- **Consolidated Security Audit**: Deduplicated security vulnerabilities with severity badges and consensus tracking (identifying when multiple models independently detect the same flaw).
- **Deep-Dive Model Reports**: Full rendered Markdown reports with code blocks, tables, and callouts.
- **Side-by-Side Model Comparison**: Direct head-to-head comparison of any two AI models.
- **Target Metrics Explorer**: Visual language distribution bar, file counts, and directory structure.
- **Built-in Workflow Guide**: In-app modal with copyable commands and templates.

---

## 💻 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Compiles reports and starts local Vite development server |
| `npm run typecheck` | Validates TypeScript types across the project (`tsc --noEmit`) |
| `npm run build` | Runs typecheck, compiles reports, and builds optimized static assets in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run analyze` | Runs python target repo scanner (`scripts/analyze-target.py`) |
| `npm run compile-reports` | Parses `reports/*.md` and generates `src/data/reports.json` |

---

## 📄 License
Apache License 2.0 (see [LICENSE](./LICENSE))
