# Comprehensive Repository Investigation Scope

This document specifies the **15 systematic investigation categories** for evaluating any target codebase, ranging from lightweight libraries and mobile applications to enterprise backends and machine learning platforms.

---

## 15 Investigation Categories Matrix

| # | Dimension | Primary Questions | Recommended Tools | Expected Outputs |
|---|---|---|---|---|
| **1** | **Project Identity & Purpose** | What problem does it solve? Who is the target user? Is it an app, library, service, or CLI? Does the declared scope match actual operational code (e.g. smartphone app vs aspirational "smart glasses" or unintegrated sensor hardware)? | Manual README / Repo review, Git tags | Executive Summary, Project Persona, Hardware Reality Check, Readiness Tier |
| **2** | **Technology Stack & Runtime** | What languages, frameworks, runtime versions, and engines are used? Distinguish declared vs actually imported dependencies. | `analyze-target.py`, `package.json`, `pyproject.toml` | Tech Stack Inventory, Runtime Compatibility Table |
| **3** | **Architecture & Repository Layout** | How is the directory organized? What are the architectural layers, module boundaries, entry points, and coupling patterns? Distinguish client-server boundaries, and classify media pipelines (continuous streaming vs discrete snapshots). | Dependency graphs, AST analyzers | Architectural Pattern (e.g. Clean Arch, Hexagonal, Client-Server), Data Flow Diagram, Modality Map |
| **4** | **Code Quality & Maintainability** | What is the cyclomatic complexity, function/class size, naming hygiene, typing discipline, and dead code presence? | Ruff, ESLint, SonarQube, Radon | Quality Scorecard, Cyclomatic Hotspots, Refactoring Opportunities |
| **5** | **Dependencies & Supply Chain (SBOM)** | Are dependencies pinned? Are there outdated packages, vulnerable libraries (CVEs), or unmaintained transitive dependencies? | `pip-audit`, `npm audit`, `osv-scanner`, Syft | Software Bill of Materials (SBOM), Vulnerability Ledger |
| **6** | **Testing & Quality Assurance** | What testing suites exist (unit, integration, e2e)? What is the line/branch coverage? Do tests mock network/external APIs effectively? | `pytest`, `jest`, `vitest`, `coverage.py` | Test Suite Map, Mocking Completeness, Flaky Test Indicators |
| **7** | **Security & Vulnerability Posture** | Are there secret leaks, injection flaws, missing rate limits, authentication bypasses, path traversals, or DoS risks? | Semgrep, Bandit, Gitleaks, regex pattern scans | Categorized Vulnerability Findings with Evidence & Confidence |
| **8** | **API & Interface Design** | What REST, WebSocket, GraphQL, or CLI interfaces are exposed? Are contracts validated with schemas (Pydantic, Zod)? Are audio/video pipelines explicit (input STT vs output TTS; local vs cloud inference)? | OpenAPI/Swagger, Pydantic, route inspection | API Inventory, Input Validation Boundaries, Media Pipeline Specifications |
| **9** | **Data Management & Persistence** | How is state persisted? Are database schemas versioned with migrations? Are transactions, indexes, and queries safe from starvation? | SQLite, PostgreSQL, Alembic, Prisma | Data Schema Map, Migration Health, Persistence Isolation Review |
| **10** | **Performance & Concurrency** | Are there CPU or I/O bottlenecks? How is concurrency managed (threads, async event loops, background queues)? | Profilers, load benchmarks, code audit | Concurrency Model, Latency Bottlenecks, Resource Leases (e.g., WorkGate) |
| **11** | **Deployment & Operations** | Is there containerization (Dockerfile, Docker Compose)? What is the exact role of container images vs host runtimes? Are containers run as non-root? How are env vars and health checks configured? | Dockerfile linter (Hadolint), CI manifests | Container Hardening Scorecard, Deployment Topology, Infrastructure Readiness |
| **12** | **Documentation & Onboarding Integrity** | How clear is onboarding and "front-door" sanity? Does the root README match the codebase reality, or does it mislead with local desktop demos vs mobile production? Are version milestones (v0.2, v0.3, v0.4) clearly differentiated? | Markdown inspection, typedoc, pydoc | Onboarding Friction Score, Front-Door Sanity Audit, Version Delta Map |
| **13** | **Development Activity & Maturity** | What is the commit cadence, release frequency, contributor diversity, and issue velocity? | `git log`, GitHub API | Maturity Score, Active Maintenance Index |
| **14** | **Licensing & Legal Compliance** | What is the root license? Are third-party model weights, datasets, or libraries restricted (e.g., CC BY-NC-ND)? | License files, SPDX scanners | Intellectual Property Matrix, Commercial Feasibility Verdict |
| **15** | **Roadmap & Actionable Recommendations** | What are the highest-impact improvements? How should technical debt be prioritized across immediate, medium, and long term? | AI multi-model consensus synthesis | Prioritized 30/60/90-Day Action Roadmap |

---

## Detailed Investigation Guidelines

### Category 1: Project Identity & Purpose
- Verify problem domain, intended deployment targets (mobile, cloud, edge, desktop).
- Check **Hardware Reality vs Aspirational Scope**: Does the repository title or documentation claim specialized hardware (e.g., smart glasses, wearable cameras, LiDAR sensors) that is actually an unintegrated aspirational concept or missing from the operational codebase (e.g. smartphone app instead)?
- Determine maintenance status: active development vs proof-of-concept prototype.

### Category 3: Architecture & Media Pipelines
- Trace client-server communication boundaries and distinguish development playground entries from production APIs.
- Classify **Media Processing Pipelines**:
  - Is video processing continuous frame streaming or discrete still image snapshot triggers?
  - Where does vision inference occur (locally on device/server vs cloud LLM/VLM APIs)?
  - Is audio input (Speech-to-Text / ASR) or audio output (Text-to-Speech / TTS)? Is audio processed locally for privacy or transmitted to third-party cloud services?

### Category 11: Deployment & Operations
- Disambiguate containerization artifacts (e.g. why does a Dockerfile exist? What is packaged in it, and does it deploy the server, workers, or client)?
- Identify execution topology: what runs on the user device vs host server vs third-party inference APIs.

### Category 12: Documentation & Onboarding Integrity
- Evaluate **Front-Door Sanity**: Does the root README give an accurate, operational onboarding guide, or does it mislead with local development prototypes (e.g. desktop WebRTC browser demo) while the primary application is a mobile app?
- Evaluate **Version Evolution & Release Trajectory**: If the project maintains release versions (e.g., v0.2, v0.3, v0.4), does documentation explain the concrete functional delta between them?
- Flag unaddressed author ambiguity or self-contradictory notes in documentation.

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
