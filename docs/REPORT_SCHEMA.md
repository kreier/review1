# Model Review Report Schema & Evaluation Rubric

## Standardized Report Structure

Every AI model technical review is submitted as a Markdown file in `reports/<model-id>.md` starting with a strict YAML frontmatter block enclosed by `---`.

---

## Frontmatter Specification

```yaml
---
model: "<Human Readable Model Name>" # Required: e.g., "Claude 3.7 Sonnet"
model_id: "<kebab-case-identifier>"   # Required: e.g., "claude-3-7-sonnet"
target_repo: "<Repository Name>"      # Required: e.g., "APEC Mắt Kính Cho Người Khiếm Thị"
target_commit: "<Git Commit SHA>"     # Optional: e.g., "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "<YYYY-MM-DD>"           # Required: e.g., "2026-10-30"

scores:
  overall: 8.9        # 0.0 - 10.0 or null if unassessed
  architecture: 9.3   # 0.0 - 10.0 or null
  code_quality: 9.1   # 0.0 - 10.0 or null
  security: 8.4       # 0.0 - 10.0 or null
  documentation: 9.2  # 0.0 - 10.0 or null

summary: "<2-3 sentence executive synopsis of codebase maturity and fitness>"

key_strengths:
  - "<Architectural or design highlight 1>"
  - "<Highlight 2>"
  - "<Highlight 3>"

key_weaknesses:
  - "<Architectural or design vulnerability 1>"
  - "<Limitation 2>"
  - "<Limitation 3>"

security_findings:
  - id: "SEC-001"
    severity: "CRITICAL"    # CRITICAL | HIGH | MEDIUM | LOW
    status: "verified"      # verified | probable | unverified
    confidence: 0.95        # 0.00 - 1.00
    category: "credentials" # credentials | injection | availability | persistence | licensing | network
    title: "<Concise title of vulnerability>"
    file: "path/to/affected_file.py"
    line_start: 120
    line_end: 145
    affected_function: "handle_request"
    description: "<Clear explanation of vulnerability>"
    evidence: "<Source code snippet or configuration excerpt>"
    impact: "<Concrete consequence if exploited>"
    recommendation: "<Remediation instructions with code example>"
---
```

---

## Scoring Rubric (0.0 to 10.0)

Reviewers and models must calibrate numeric scores against these objective standards:

| Score Range | Tier | Definition & Criteria |
|---|---|---|
| **9.0 – 10.0** | **Exemplary** | Production-hardened; comprehensive automated test coverage (>85%); strict static typing and linting; zero unmitigated high/critical security risks; fully documented APIs and architecture. |
| **8.0 – 8.9** | **Strong / Ready** | Solid architecture with minor technical debt; good test suite (>70%); defensive error handling; minor risks properly isolated (e.g. rate limiting needed at reverse proxy). |
| **6.5 – 7.9** | **Acceptable / Prototype** | Functional but lacks polish; minimal or patchy test coverage; some tightly coupled components; unencrypted configs or missing input boundaries. |
| **5.0 – 6.4** | **Underdeveloped** | Significant architectural debt; no automated testing; brittle error handling; noticeable security gaps (e.g., exposed endpoints, hardcoded credentials). |
| **0.0 – 4.9** | **Critical Risks** | Fundamentally flawed, unmaintained, or insecure architecture; severe vulnerabilities (SQLi, command injection, leaked private keys); un runnable code. |
| **null** | **Unassessed** | Model was not asked or could not objectively assess this specific dimension. **Never defaulted to 0.0**. |

---

## Finding Evidence Tiers

To prevent hallucinated vulnerabilities from corrupting audits, all findings must declare their verification status:

| Status | Name | Verification Standard |
|---|---|---|
| `verified` | **Confirmed Finding** | An exact file path and line numbers exist, accompanied by an explicit code excerpt or reproducible exploit vector demonstrating the issue. |
| `probable` | **Likely Risk** | Code structure strongly suggests vulnerability (e.g., SQLite without persistent volume configuration), but final impact depends on runtime deployment environment. |
| `unverified` | **Architectural Observation** | A potential enhancement, design trade-off, or hypothetical scale bottleneck (e.g., in-memory concurrency locks preventing multi-container horizontal scale). |
