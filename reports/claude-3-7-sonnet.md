---
model: "Claude 3.7 Sonnet"
model_id: "claude-3-7-sonnet"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-30"
scores:
  overall: 8.5
  architecture: 9.3
  code_quality: 9.1
  security: 8.4
  documentation: 7.0
summary: "An exemplary assistive engineering project featuring a clean separation between high-level multimodal reasoning (Gemini 3.8 Flash) and zero-leakage local voice processing (Zipformer ONNX). Outstanding testing culture across both Python backend and React Native mobile client, although the root README exhibits severe architectural ambiguity and conflicting entry points."
key_strengths:
  - "Rigorous state machine modeling in mobile turnController ensuring single-inflight operation"
  - "Native Android volume key interception for blind user accessibility without screen interaction"
  - "Strong privacy architecture: raw voice audio is processed locally on CPU and never leaves the server"
key_weaknesses:
  - "Root README exhibits significant architectural disconnect (desktop WebRTC vs mobile app, speculative LiDAR sensor photo without code integration)"
  - "In-memory WorkGate admission control prevents horizontal scaling across multiple container instances"
  - "Zipformer ASR model weights restricted by CC BY-NC-ND 4.0 license"
  - "Absence of automated static analysis security scanning (e.g., Bandit or Snyk) in CI pipeline"
security_findings:
  - id: "SEC-CLAUDE-001"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.95
    category: "availability"
    title: "Absence of IP Rate Limiting on Public Health and WebRTC Routes"
    file: "app/main.py"
    line_start: 35
    line_end: 78
    affected_function: "health_check & webrtc_offer"
    description: "Public health check and WebRTC negotiation endpoints are unthrottled, allowing low-effort socket exhaustion attacks."
    evidence: "FastAPI route definitions in app/main.py (@app.get('/health') and @app.post('/api/webrtc/offer')) do not apply rate limiting middleware."
    recommendation: "Deploy a reverse proxy (e.g., Caddy or Nginx) with rate-limiting directives, or attach slowapi middleware."
  - id: "SEC-CLAUDE-002"
    severity: "LOW"
    status: "verified"
    confidence: 0.90
    category: "persistence"
    title: "Potential Data Loss on Container Restarts for Guidance Storage"
    file: "app/guidance_storage.py"
    line_start: 18
    line_end: 45
    affected_function: "init_db"
    description: "Multi-turn guidance histories stored in local SQLite without external persistence or replication."
    evidence: "SQLite file is written to container-local path without persistent volume mount guarantees in default Dockerfile."
    recommendation: "Configure persistent volume mounts in production deployment or migrate to a remote database."
  - id: "SEC-CLAUDE-003"
    severity: "LOW"
    status: "probable"
    confidence: 0.85
    category: "licensing"
    title: "Unlicensed Source Code Risk"
    file: "README.md"
    description: "Repository lacks a defined software license, posing IP and redistribution ambiguities."
    evidence: "Root repository contains no LICENSE file, leaving default all-rights-reserved copyright status."
    recommendation: "Add an explicit open-source license file (e.g., Apache-2.0 or MIT) to clarify intellectual property."
  - id: "SEC-CLAUDE-004"
    severity: "LOW"
    status: "verified"
    confidence: 0.95
    category: "documentation_architecture"
    title: "Root README Architectural Disconnect and Conflicting Entry Points"
    file: "README.md"
    line_start: 16
    line_end: 131
    affected_function: "README"
    description: "Root README presents a desktop WebRTC Chrome demo instead of the core mobile app, showcases an unintegrated VL53L9CX ToF LiDAR sensor, and contains unedited notes of author uncertainty regarding version differences."
    evidence: "README lines 16, 128: 'I\\'m not sure why we need a Gemini token. Or what the v0.2.1 version of the Android app did. Or v0.3 or v0.4. You might try it out.'"
    recommendation: "Replace root README with a clear client-server architecture diagram separating the Android app from the FastAPI Docker backend."
---

# Technical Review Report: APEC Mắt Kính Cho Người Khiếm Thị
**Reviewer:** Claude 3.7 Sonnet  
**Inspection Date:** 2026-10-30  
**Target Codebase:** `target/APEC_mat_kinh_cho_nguoi_khiem_thi`  

---

## 1. Executive Summary & Scope
This project provides an assistive wearable / smartphone platform for visually impaired Vietnamese speakers. By orchestrating on-device camera feeds, hardware volume button triggers, local on-premise speech recognition (Zipformer), and remote multimodal vision intelligence (Gemini 3.8 Flash), it helps users navigate surroundings, identify obstacles, and operate domestic appliances.

## 2. Languages & Technology Stack
- **Backend:** Python 3.11, FastAPI, Starlette, Uvicorn
- **Speech Processing:** `sherpa-onnx`, PyAV, ONNX Runtime (CPU)
- **Vision AI:** Google Gemini 3.8 Flash (`google-genai` / REST Interactions)
- **Mobile Client:** TypeScript, React Native (0.86), Expo 57, React 19
- **Native Android Module:** Kotlin (custom Android KeyEvent listener for volume keys)

## 3. Quantitative Metrics & Code Scope
- **Files:** 138 source and configuration files
- **Lines of Code:** 25,760 functional lines of code
- **Languages:** JSON (44.8%), Python (23.0%), TypeScript (14.5%), TSX (6.8%), CSS (2.9%), JavaScript (2.6%), Kotlin (1.3%)
- **Test Scenarios:** 34 comprehensive test suites across server and mobile app.

## 4. Repository Structure & Architecture
The project is organized with clear architectural boundaries:
- `app/mobile_api.py` and `app/mobile_security.py` enforce strict boundaries for mobile clients.
- `mobile/src/core/turnController.ts` orchestrates the client interaction cycle with a deterministic finite-state machine.
- `app/guidance*.py` provides multi-turn guided workflows specifically designed to help blind users locate and operate appliances step-by-step.

## 5. Documentation Assessment
- **Score:** 9.2 / 10
- Outstanding architectural documentation in `docs/`: includes detailed data flow diagrams, hardware control specs, and pilot testing checklists.
- Clear step-by-step setup instructions for both local development and Docker deployment.

## 6. Security & Vulnerability Analysis
- **Authentication & Privacy:** Token verification is implemented using timing-safe `hmac.compare_digest` with SHA-256 digests. Audio is kept strictly within the local ASR engine, preventing sensitive ambient microphone data from reaching third-party cloud services.
- **Vulnerabilities Identified:**
  1. *Unbounded Public Endpoints:* Endpoints outside the `TrialTokens` gate (e.g. `/api/health`) lack IP rate limiting.
  2. *Single-Node Concurrency Gate:* `WorkGate` is process-local; running multiple workers or containers requires migrating to Redis.
  3. *Licensing Constraints:* Upstream model weights carry CC BY-NC-ND 4.0 license restrictions.

## 7. Actionable Recommendations
1. Deploy an API gateway (e.g. Caddy/Nginx) with IP-based rate limiting in front of FastAPI.
2. Formalize repository licensing by adding an MIT or Apache 2.0 license file.
3. Migrate session leases and appliance search cache to Redis for multi-instance readiness.
