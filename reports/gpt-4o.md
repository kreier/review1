---
model: "GPT-4o"
model_id: "gpt-4o"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
review_date: "2026-10-30"
scores:
  overall: 8.6
  architecture: 9.0
  code_quality: 8.8
  security: 8.2
  documentation: 8.9
summary: "High-impact accessibility application built with thoughtful attention to real-world edge cases. Combines offline local speech recognition with Gemini 3.8 Flash multimodal scene interpretation and an Expo-based Android client with tactile hardware overrides."
key_strengths:
  - "Local CPU-based Vietnamese speech recognition protects user microphone privacy"
  - "Hardware volume button hooks solve key non-visual interaction challenges for blind users"
  - "Defensive API design with bounded multipart streams and constant-time token verification"
key_weaknesses:
  - "In-memory WorkGate state restricts deployment to a single process/container"
  - "Non-commercial license on speech recognition model weights limits commercialization"
  - "Missing automated vulnerability auditing (e.g. pip-audit, npm audit) in GitHub Actions"
security_findings:
  - severity: "MEDIUM"
    title: "Denial of Service Risk on Unauthenticated Routes"
    file: "app/main.py"
    description: "WebRTC and health check routes do not enforce rate limiting or connection limits."
  - severity: "LOW"
    title: "Ephemeral State Storage in Local SQLite"
    file: "app/guidance_storage.py"
    description: "Guidance sessions and feedback records stored in local SQLite without automated backups."
  - severity: "LOW"
    title: "Missing Formal License File"
    file: "LICENSE"
    description: "Root repository lacks a clear license declaration, creating legal ambiguity."
---

# Technical Review Report: APEC Mắt Kính Cho Người Khiếm Thị
**Reviewer:** GPT-4o  
**Inspection Date:** 2026-10-30  
**Target Codebase:** `target/APEC_mat_kinh_cho_nguoi_khiem_thi`  

---

## 1. Executive Summary & Scope
This codebase delivers an AI-powered smart glass / smartphone assistant for blind individuals. It captures photos via the rear camera upon receiving a spoken prompt or physical button click, interprets the scene using Gemini 3.8 Flash, and reads the guidance aloud in natural Vietnamese.

## 2. Languages & Technology Stack
- **Primary Languages:** Python 3.11 (backend), TypeScript (mobile client), Kotlin (Android plugins)
- **Frameworks:** FastAPI, React Native 0.86, Expo 57, React 19
- **Inference Engines:** Sherpa-ONNX (Zipformer ASR), Google Gemini 3.8 Flash (Multimodal Vision)
- **Testing:** Pytest, Jest

## 3. Quantitative Metrics & Code Scope
- **File Count:** 138 files
- **Total Code Lines:** ~25,760 lines
- **Code Distribution:** Heavy emphasis on robust schemas, test coverage, and modular domain logic.
- **Test Scenarios:** 34 test suites covering both unit and integration tests.

## 4. Repository Structure & Architecture
The repository architecture is cleanly compartmentalized:
- `app/`: Houses backend services with distinct entry points for local WebRTC testing (`main.py`) vs hardened mobile endpoints (`mobile_api.py`).
- `mobile/`: Complete Expo React Native application featuring hardware button event listeners.
- `docs/`: In-depth documentation describing hardware setups, API specs, and pilot testing procedures.

## 5. Documentation Assessment
- **Score:** 8.9 / 10
- Clear setup guides, testing checklists, and hardware integration diagrams.
- Missing an architecture decision record (ADR) detailing why specific model weights were selected.

## 6. Security & Vulnerability Analysis
1. **Privacy Preservation:** Microphone audio is never sent off the machine; only the final transcribed text and captured photo are transmitted to Gemini.
2. **Access Control:** Tokens are validated using SHA-256 digests and `hmac.compare_digest`.
3. **Identified Risks:**
   - Unthrottled endpoints outside the token gate could be exploited for connection exhaustion.
   - Restrictive model licensing (CC BY-NC-ND 4.0) restricts commercial redistribution.

## 7. Actionable Recommendations
1. Enforce IP-based rate limiting via reverse proxy (Nginx / Cloudflare).
2. Add a standard open-source license file (`LICENSE`).
3. Externalize session state to Redis for horizontal scalability.
