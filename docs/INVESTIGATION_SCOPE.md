# Comprehensive Repository Investigation Scope

This document specifies the **15 systematic investigation categories** for evaluating any target codebase, ranging from lightweight libraries and mobile applications to enterprise backends and machine learning platforms.

---

## 15 Investigation Categories Matrix

| # | Dimension | Primary Questions | Recommended Tools | Expected Outputs |
|---|---|---|---|---|
| **1** | **Project Identity & Purpose** | What problem does it solve? Who is the target user? Is it an app, library, service, or CLI? Is it active, experimental, or abandoned? | Manual README / Repo review, Git tags | Executive Summary, Project Persona, Readiness Tier |
| **2** | **Technology Stack & Runtime** | What languages, frameworks, runtime versions, and engines are used? Distinguish declared vs actually imported dependencies. | `analyze-target.py`, `package.json`, `pyproject.toml` | Tech Stack Inventory, Runtime Compatibility Table |
| **3** | **Architecture & Repository Layout** | How is the directory organized? What are the architectural layers, module boundaries, entry points, and coupling patterns? | Dependency graphs, AST analyzers | Architectural Pattern (e.g. Clean Arch, Hexagonal, MVC), Data Flow Diagram |
| **4** | **Code Quality & Maintainability** | What is the cyclomatic complexity, function/class size, naming hygiene, typing discipline, and dead code presence? | Ruff, ESLint, SonarQube, Radon | Quality Scorecard, Cyclomatic Hotspots, Refactoring Opportunities |
| **5** | **Dependencies & Supply Chain (SBOM)** | Are dependencies pinned? Are there outdated packages, vulnerable libraries (CVEs), or unmaintained transitive dependencies? | `pip-audit`, `npm audit`, `osv-scanner`, Syft | Software Bill of Materials (SBOM), Vulnerability Ledger |
| **6** | **Testing & Quality Assurance** | What testing suites exist (unit, integration, e2e)? What is the line/branch coverage? Do tests mock network/external APIs effectively? | `pytest`, `jest`, `vitest`, `coverage.py` | Test Suite Map, Mocking Completeness, Flaky Test Indicators |
| **7** | **Security & Vulnerability Posture** | Are there secret leaks, injection flaws, missing rate limits, authentication bypasses, path traversals, or DoS risks? | Semgrep, Bandit, Gitleaks, regex pattern scans | Categorized Vulnerability Findings with Evidence & Confidence |
| **8** | **API & Interface Design** | What REST, WebSocket, GraphQL, or CLI interfaces are exposed? Are contracts validated with schemas (Pydantic, Zod)? | OpenAPI/Swagger, Pydantic, route inspection | API Inventory, Input Validation Boundaries, Backward Compatibility Notes |
| **9** | **Data Management & Persistence** | How is state persisted? Are database schemas versioned with migrations? Are transactions, indexes, and queries safe from starvation? | SQLite, PostgreSQL, Alembic, Prisma | Data Schema Map, Migration Health, Persistence Isolation Review |
| **10** | **Performance & Concurrency** | Are there CPU or I/O bottlenecks? How is concurrency managed (threads, async event loops, background queues)? | Profilers, load benchmarks, code audit | Concurrency Model, Latency Bottlenecks, Resource Leases (e.g., WorkGate) |
| **11** | **Deployment & Operations** | Is there containerization (Dockerfile, Docker Compose)? Are containers run as non-root? How are env vars and health checks configured? | Dockerfile linter (Hadolint), CI manifests | Container Hardening Scorecard, Infrastructure Readiness |
| **12** | **Documentation Quality** | How clear is onboarding, installation, configuration, inline docstrings, and architectural diagrams? | Markdown inspection, typedoc, pydoc | Onboarding Friction Score, Documentation Coverage |
| **13** | **Development Activity & Maturity** | What is the commit cadence, release frequency, contributor diversity, and issue velocity? | `git log`, GitHub API | Maturity Score, Active Maintenance Index |
| **14** | **Licensing & Legal Compliance** | What is the root license? Are third-party model weights, datasets, or libraries restricted (e.g., CC BY-NC-ND)? | License files, SPDX scanners | Intellectual Property Matrix, Commercial Feasibility Verdict |
| **15** | **Roadmap & Actionable Recommendations** | What are the highest-impact improvements? How should technical debt be prioritized across immediate, medium, and long term? | AI multi-model consensus synthesis | Prioritized 30/60/90-Day Action Roadmap |

---

## Detailed Investigation Guidelines

### Category 1: Project Identity & Purpose
- Verify problem domain, intended deployment targets (mobile, cloud, edge, desktop).
- Determine maintenance status: active development vs proof-of-concept prototype.

### Category 4: Code Quality
- Check for type annotations (Python `mypy`/`typing`, TypeScript strict mode).
- Audit error handling patterns (bare `except:`, unhandled promise rejections, error swallowing).

### Category 7: Security Findings Standard
Every reported security finding must strictly specify:
```yaml
id: "SEC-001"
severity: "HIGH" # CRITICAL | HIGH | MEDIUM | LOW
confidence: 0.92 # 0.0 to 1.0
status: "verified" # verified | probable | unverified
category: "availability" # injection | auth | persistence | network | config
title: "Unthrottled WebRTC offer endpoint permits socket exhaustion"
file: "app/main.py"
line_start: 35
line_end: 62
affected_function: "webrtc_offer"
evidence: "@app.post('/api/webrtc/offer') lacks rate limit dependency"
impact: "Attacker can flood signaling server, exhausting CPU and file descriptors"
recommendation: "Apply slowapi limiter middleware: @limiter.limit('10/minute')"
```
