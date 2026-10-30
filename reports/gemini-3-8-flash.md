---
model: "Gemini 3.8 Flash"
model_id: "gemini-3-8-flash"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-30"
scores:
  overall: 8.8
  architecture: 9.2
  code_quality: 8.9
  security: 8.3
  documentation: 9.0
summary: "An exceptionally well-engineered multimodal assistive system for the visually impaired. Combines an on-device local Zipformer STT engine (preventing microphone audio leaks), Google Gemini 3.8 Flash vision reasoning, and a specialized React Native/Expo client with tactile hardware volume button controls."
key_strengths:
  - "Privacy-first architecture: voice STT executed locally via Zipformer/sherpa-onnx; audio is never uploaded to third-party cloud APIs"
  - "Purpose-built accessibility UX: hardware volume key triggers and audio cue feedback designed specifically for blind users"
  - "Rigorous safety controls: SHA-256 token authorization, concurrency work-gates, strict multipart bounds, and unprivileged Docker user"
key_weaknesses:
  - "Zipformer ASR model weights are licensed under CC BY-NC-ND 4.0, restricting commercial use and derivative fine-tuning"
  - "Stateful in-memory concurrency gate (WorkGate) limits horizontal scalability across multiple container instances"
  - "Missing automated IP-level rate-limiting middleware on public health and WebRTC endpoints"
security_findings:
  - id: "SEC-GEMINI-001"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.94
    category: "availability"
    title: "Denial-of-Service Risk via Unthrottled Public Endpoints"
    file: "app/main.py & app/mobile_api.py"
    line_start: 35
    line_end: 60
    affected_function: "health & webrtc"
    description: "While WorkGate caps active inference to 2 slots, public endpoints (/api/health, /api/webrtc/offer) lack IP-based rate limiting, allowing connection flooding."
    evidence: "FastAPI routers declare no request throttling or IP limiters on exposed /health or /api/webrtc/offer endpoints."
    recommendation: "Wrap FastAPI with slowapi or enforce rate limits at ingress proxy."
  - id: "SEC-GEMINI-002"
    severity: "LOW"
    status: "verified"
    confidence: 0.88
    category: "persistence"
    title: "Local State Dependency in Guidance Storage"
    file: "app/guidance_storage.py"
    line_start: 22
    line_end: 50
    affected_function: "get_connection"
    description: "Guidance sessions rely on local SQLite/in-memory storage; container restarts without persistent volume mounts will drop active multi-turn guidance state."
    evidence: "Database connection opens local file SQLite instance without transactional replication or external persistence."
    recommendation: "Mount persistent volume in Docker container or migrate to hosted PostgreSQL/Redis."
  - id: "SEC-GEMINI-003"
    severity: "LOW"
    status: "probable"
    confidence: 0.85
    category: "licensing"
    title: "Missing Root Repository License"
    file: "README.md"
    description: "Repository documentation acknowledges the license is missing; creates legal ambiguity for third-party contributors and pilot testers."
    evidence: "README explicitly references absent license terms and prospective licensing."
    recommendation: "Adopt standard open-source license file (MIT or Apache 2.0)."
---

# Technical Review Report: APEC Mắt Kính Cho Người Khiếm Thị
**Reviewer:** Gemini 3.8 Flash  
**Inspection Date:** 2026-10-30  
**Target Codebase:** `target/APEC_mat_kinh_cho_nguoi_khiem_thi`  

---

## 1. Executive Summary & Scope
**APEC Mắt Kính Cho Người Khiếm Thị** (Smart Glasses for the Visually Impaired) is an advanced assistive technology platform combining mobile computer vision, local edge speech recognition, and generative multimodal AI.

The application allows visually impaired users to interact with their environment through a wearable or smartphone camera:
1. **User speaks a query or command** (or presses a physical hardware key on their headset/phone).
2. **Local Speech Recognition (ASR)** transcribes Vietnamese speech in real-time on the server CPU using Zipformer (`hynt/Zipformer-30M-RNNT-Streaming-6000h`), keeping raw microphone audio entirely private.
3. **Multimodal Vision Analysis** sends the captured camera frame and transcribed text query to Google Gemini (`gemini-3.8-flash`) with privacy flag `store=false`.
4. **Interactive Spoken Guidance** directs the user step-by-step through physical tasks (identifying home appliances, remote controls, finding buttons, reading labels).

---

## 2. Languages & Technology Stack
- **Backend & AI Pipeline:**
  - **Python 3.11** with FastAPI, Uvicorn, and Starlette
  - **Sherpa-ONNX & PyAV**: Local CPU streaming speech-to-text (STT) runtime
  - **Google GenAI SDK**: Multimodal vision analysis powered by `gemini-3.8-flash`
  - **WebRTC & PyAV**: Real-time peer-to-peer audio/video streaming for desktop development
  - **SQLite & Alembic**: Lightweight state and guidance migration persistence
- **Mobile Client (`mobile/`):**
  - **TypeScript & React Native** (v0.86) on **Expo 57**
  - **React 19**
  - **Expo Camera, Expo Audio, Expo Speech, Expo Haptics, Expo SecureStore**
  - **Native Android Hardware Hooks**: Intercepts volume buttons (`KeyEvent`) to allow non-visual shutter and mic activation
- **Containerization & Deployment:**
  - Multi-stage Dockerfile (`python:3.11.16-slim-bookworm`)
  - EAS Build profile for Android APK generation

---

## 3. Quantitative Metrics & Code Scope
According to the automated repository analyzer:
- **Total Files Analyzed:** 138 files
- **Total Lines of Code:** 25,760 lines (27,525 total lines, 1,765 blank)
- **Directory Hierarchy:** 34 directories
- **Language Breakdown:**
  - **JSON & Schemas:** 11,552 lines (44.8%) across 7 files
  - **Python (Backend & Tests):** 5,915 lines (23.0%) across 39 files
  - **TypeScript (Mobile & Services):** 3,744 lines (14.5%) across 37 files
  - **TypeScript React (Components & Screens):** 1,754 lines (6.8%) across 14 files
  - **CSS / Styles:** 758 lines (2.9%)
  - **JavaScript:** 672 lines (2.6%) across 4 files
  - **Markdown (Documentation):** 558 lines (2.2%) across 15 files
  - **Kotlin (Native Android Hooks):** 345 lines (1.3%) across 4 files
- **Test Suite Scope:**
  - **Backend:** 18 pytest suites (~130KB of test code) with extensive mocks for WebRTC, Gemini API errors, rate quotas, and token gates.
  - **Mobile:** 16 Jest test suites covering native hardware controls, state machines, and turn controllers.

---

## 4. Repository Structure & Architecture
The repository displays an exemplary separation of concerns:
```
APEC_mat_kinh_cho_nguoi_khiem_thi/
├── app/                        # FastAPI Backend Service
│   ├── asr.py                  # Sherpa-ONNX Zipformer model loader & streaming recognizer
│   ├── guidance*.py            # Multi-turn spoken guidance engine & appliance search
│   ├── mobile_api.py           # Hardened mobile endpoints (/api/v2/analyze, /api/v2/transcribe)
│   ├── mobile_security.py      # TrialTokens authentication and WorkGate admission controller
│   ├── session.py & webrtc.py  # WebRTC peer connection management
│   └── vision.py               # Gemini 3.8 Flash multimodal client wrapper
├── mobile/                     # React Native Expo Mobile App
│   ├── App.tsx                 # Root application wrapper
│   ├── src/core/               # State machines (TurnController, DeviceTaskController)
│   ├── src/hooks/              # Hardware buttons, audio recording, and camera hooks
│   ├── src/screens/            # High-contrast, accessibility-first screens
│   └── plugins/                # Android native KeyEvent interceptor for volume keys
├── docs/                       # Architectural specifications, release notes, hardware guides
└── tests/                      # Full test coverage for both backend and mobile client
```

### Architectural Highlights
- **Turn-based State Machine (`turnController.ts`):** Enforces atomic transitions (`IDLE` → `RECORDING` → `PROCESSING` → `SPEAKING`), preventing overlapping race conditions on slow cellular networks.
- **Strict Separation of Development vs Production API:**
  - `app.main:app`: Internal desktop WebRTC playground.
  - `app.mobile_api:app`: Strictly hardened mobile production API with explicit input boundaries.

---

## 5. Documentation Assessment
- **Rating:** 9.0 / 10
- **Depth & Completeness:** The `docs/` directory contains 15 comprehensive guides:
  - [`MOBILE_ARCHITECTURE.md`](docs/MOBILE_ARCHITECTURE.md): Complete data flow and error code specifications.
  - [`HARDWARE_CONTROLS_030.md`](docs/HARDWARE_CONTROLS_030.md): Technical breakdown of native Android volume key intercepts.
  - [`ANDROID_ACCEPTANCE.md`](docs/ANDROID_ACCEPTANCE.md): Testing checklist specifically tailored for blind pilot participants.
- **Code Comments:** Extensive inline documentation and Vietnamese language localization strings across both client and server.

---

## 6. Security & Vulnerability Analysis
- **Token Security:** Authentication uses SHA-256 digested tokens validated via `hmac.compare_digest` in `app/mobile_security.py`, preventing timing attacks. Tokens are stored in Android `SecureStore` (backed by Android Keystore / hardware-backed TEE).
- **Resource Protection:**
  - `WorkGate` restricts concurrent heavy inference requests to 2 leases, failing closed with HTTP 429 when saturated.
  - Multipart payloads are bounded by custom stream wrappers (`bounded_form`), enforcing max 4 MiB payload and 1280px image dimensions to guard against memory exhaustion.
- **Container Isolation:** The Dockerfile creates a non-root system user (`pilot`, UID 10001) and drops root privileges before launching the Uvicorn process.
- **Areas of Risk:**
  1. *Public Endpoint Rate Limiting:* `/api/health` and `/api/webrtc/offer` lack IP-based rate limiting. A reverse proxy (e.g. Nginx, Cloudflare) must front the service in production.
  2. *Model Weight Licensing:* The speech model weights (`hynt/Zipformer-30M-RNNT-Streaming-6000h`) use CC BY-NC-ND 4.0, which prohibits commercial exploitation and derivative works.

---

## 7. Actionable Recommendations & Roadmap
1. **Add Reverse Proxy / Rate Limiter:** Place Caddy or Nginx with `limit_req` in front of the container to protect health check and audio upload routes from denial-of-service.
2. **Clarify Project Licensing:** Add an explicit open-source license (e.g. MIT or Apache-2.0) to clarify the rights of contributors and adopters.
3. **Decouple Admission State for Scaling:** When expanding beyond pilot testing (more than 2 concurrent users), migrate `WorkGate` leases and token state to a shared Redis cluster.
