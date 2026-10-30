---
model: "Gemini 3.8 Flash"
model_id: "gemini-3-8-flash"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-30"
scores:
  overall: 8.3
  architecture: 9.2
  code_quality: 8.9
  security: 8.3
  documentation: 6.8
summary: "An exceptionally well-engineered multimodal assistive system for the visually impaired combining an on-device local Zipformer STT engine, Google Gemini 3.8 Flash vision reasoning, and a specialized React Native/Expo client with tactile hardware volume button controls. However, the root onboarding documentation suffers from severe cognitive friction, presenting conflicting desktop WebRTC vs mobile architectures, unexplained version increments, and speculative hardware references."
key_strengths:
  - "Privacy-first architecture: voice STT executed locally via Zipformer/sherpa-onnx; raw audio is never sent to third-party cloud APIs"
  - "Purpose-built accessibility UX: native hardware volume key triggers and audio cue feedback designed specifically for blind users"
  - "Rigorous safety controls: SHA-256 token authorization, concurrency work-gates, strict multipart bounds, and unprivileged Docker user"
key_weaknesses:
  - "Severe root onboarding and architectural disconnect: root README presents a desktop WebRTC demo, contains unresolved notes of author confusion, and highlights speculative LiDAR hardware absent from the operational codebase"
  - "Documentation is fragmented across 15+ Vietnamese markdown files without an overarching English architecture map"
  - "Zipformer ASR model weights are licensed under CC BY-NC-ND 4.0, restricting commercial use and derivative fine-tuning"
  - "Stateful in-memory concurrency gate (WorkGate) limits horizontal scalability across multiple container instances"
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
  - id: "SEC-GEMINI-004"
    severity: "LOW"
    status: "verified"
    confidence: 0.96
    category: "documentation_architecture"
    title: "Root README Architectural Disconnect and Conflicting Entry Points"
    file: "README.md"
    line_start: 16
    line_end: 131
    affected_function: "README & onboarding documentation"
    description: "The root README instructs users to launch a local desktop WebRTC Chrome demo (app.main:app) while the production mobile API is app.mobile_api:app. It also showcases speculative hardware (VL53L9CX ToF LiDAR) without codebase integration, and contains explicit author confusion notes regarding versions and tokens."
    evidence: "README lines 16, 128: 'I\\'m not sure why we need a Gemini token. Or what the v0.2.1 version of the Android app did. Or v0.3 or v0.4. You might try it out.'"
    impact: "Creates severe cognitive friction, onboarding failure, and uncertainty for reviewers and engineers attempting to operate the system."
    recommendation: "Restructure root README with a unified architectural diagram clearly separating the Android client, the FastAPI Docker container, the local Zipformer STT engine, and the Gemini 3.8 Flash cloud API."
---

# Technical Review Report: APEC Mắt Kính Cho Người Khiếm Thị
**Reviewer:** Gemini 3.8 Flash  
**Inspection Date:** 2026-10-30  
**Target Codebase:** `target/APEC_mat_kinh_cho_nguoi_khiem_thi`  

---

## 1. Executive Summary & Scope
**APEC Mắt Kính Cho Người Khiếm Thị** (Smart Glasses for the Visually Impaired) is an advanced assistive technology platform combining a mobile computer vision client, local edge speech recognition, and generative multimodal AI reasoning.

Despite the project name ("Smart Glasses"), the actual implementation is an **Android smartphone application** paired with a **Python FastAPI backend**, designed as an accessible prototype for visually impaired individuals.

The operational flow works as follows:
1. **User speaks a query or command** (triggered via physical hardware volume keys on their phone or headset).
2. **Local Speech Recognition (ASR)** transcribes Vietnamese speech in real-time on the server CPU using Zipformer (`hynt/Zipformer-30M-RNNT-Streaming-6000h`), keeping raw microphone audio entirely private.
3. **Multimodal Vision Analysis** sends a discrete still JPEG snapshot and the transcribed text query to Google Gemini (`gemini-3.8-flash` or `gemini-3.1-flash-lite`) with privacy flag `store=false`.
4. **Interactive Spoken Guidance** reads the AI response aloud via native Android Text-to-Speech (TTS) and TalkBack, directing the user through physical tasks (identifying home appliances, remote controls, finding buttons, reading labels).

---

## 2. Languages & Technology Stack
- **Backend & AI Pipeline:**
  - **Python 3.11** with FastAPI, Uvicorn, and Starlette
  - **Sherpa-ONNX & PyAV**: Local CPU streaming speech-to-text (STT) runtime
  - **Google GenAI SDK**: Multimodal vision analysis powered by `gemini-3.8-flash`
  - **WebRTC & PyAV**: Local peer-to-peer audio/video streaming for desktop development only
  - **SQLite & PostgreSQL / Redis**: State storage, remote guidance profiles, and migrations
- **Mobile Client (`mobile/`):**
  - **TypeScript & React Native** (v0.86) on **Expo 57**
  - **React 19**
  - **Expo Camera, Expo Audio, Expo Speech, Expo Haptics, Expo SecureStore**
  - **Native Android Hardware Hooks**: Custom Kotlin module (`KeyEventModule.kt`) intercepting volume buttons to allow non-visual shutter and mic activation
- **Containerization & Deployment:**
  - Multi-stage Dockerfile (`python:3.11.16-slim-bookworm`) with pre-cached model weights
  - EAS Build profile for Android APK generation

---

## 3. Quantitative Metrics & Code Scope
According to deterministic metrics extracted from the target repository:
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
  - **Backend:** 18 pytest suites (~130KB of test code, 322 passing tests) with extensive mocks for WebRTC, Gemini API errors, rate quotas, and token gates.
  - **Mobile:** 16 Jest test suites (329 passing unit tests) covering native hardware controls, state machines, and turn controllers.

---

## 4. Architectural Disambiguation & Key Component Breakdown

To resolve the significant onboarding ambiguity in the repository, this section directly answers the core operational questions:

### 1. Why is there a Docker container?
The `Dockerfile` packages the production mobile backend (`app.mobile_api:app`):
- **Pre-baked STT Model Weights**: In Stage 1, it downloads the ~51 MB Zipformer ONNX model into `/opt/zipformer`.
- **Production Cloud Deployment**: During local pilot testing, developers ran the server on a MacBook via temporary Cloudflare Quick Tunnels (`trycloudflare.com`). The Docker container exists to deploy the FastAPI backend to permanent cloud infrastructure (Google Cloud Run, AWS ECS, or a VPS) running under an unprivileged user (`pilot`, UID 10001).

### 2. What is the Android app doing?
Located in `mobile/`, the app is an assistive "eyes" prototype for blind users:
- Captures environment photos from the rear camera and records Vietnamese voice queries.
- Submits them via HTTPS multipart (`/api/v2/analyze`) with a Bearer trial token stored in Android `SecureStore`.
- Converts the returned structured guidance into speech using native Android TTS / TalkBack.
- Overrides volume buttons so users never need to touch the phone screen.

### 3. What are versions 0.2, 0.3, and 0.4 doing — how are they different?
- **v0.2.x (0.2.0 / 0.2.1)** — *Voice Context & Multi-turn Q&A*:
  - Enables asking follow-up questions about the *same captured image* ("Hỏi thêm về ảnh này") without re-taking the photo (cached up to 5 minutes, 3 conversational turns).
  - Voice command confirmation flow ("Gửi câu hỏi", "Nói lại câu hỏi", "Hủy câu hỏi") eliminating typing.
- **v0.3.0** — *Hardware Volume Button Overrides*:
  - Native Kotlin interceptor for volume keys: single short press Volume Up starts recording ("Đang nghe"), second press snaps and sends; short press Volume Down stops/cancels immediately; long press adjusts volume.
- **v0.4.0** — *Remote Control Tactile Guidance Assistant*:
  - Dedicated guidance mode assisting blind users in operating unfamiliar home appliance remotes (TVs, ACs).
  - Uses an approved database of remote models (`migrations/001_guidance.sql`) to provide physical tactile directions ("Feel the raised power button at top-left").
  - Includes an administrative approval dashboard (`localhost:8081`, `app/guidance_admin.py`).

### 4. What is the video input?
- **There is no continuous video stream analyzed by AI.**
- In the desktop demo (`app/main.py`), WebRTC streams video for local browser preview only; pressing "Chụp ảnh" captures a single canvas frame.
- In the Android app, the camera preview assists aiming, but only a **single JPEG frame** (clamped to max 1280px, $\le 2\text{ MiB}$) is captured and transmitted per turn.

### 5. Is the video locally analyzed, or a still image sent to Gemini 3.8 Flash?
- **A still JPEG snapshot is transmitted to Google Gemini 3.8 Flash (or Gemini 3.1 Flash-Lite)** via the Gemini API with `store=false`.
- Video is NOT analyzed locally. Local processing is strictly limited to camera framing, image resizing, and Zipformer audio transcription.

### 6. What is Zipformer used for — audio input or output?
- **Strictly Audio INPUT (Speech-to-Text / ASR).**
- It runs `hynt/Zipformer-30M-RNNT-Streaming-6000h` locally on the server CPU via `sherpa-onnx`. It transcribes user voice queries into Vietnamese text so raw voice audio is never transmitted to Google.
- Audio **output** (reading answers back) is handled by native Android TTS / TalkBack (`expo-speech`) or browser speech synthesis.

### 7. What should this system run on?
- **Client**: Any Android smartphone (Android 10+ / API 29+) running the Expo APK.
- **Server**: A Linux/Docker environment or macOS machine (Python 3.11, CPU with AVX/libgomp, ~2 GB RAM) with an active internet connection to reach Google's Gemini API.

---

## 5. Documentation & Onboarding Assessment
- **Rating:** 6.8 / 10 (Calibrated from initial 9.0)
- **The Documentation Paradox**:
  - *Internal Technical Depth (High)*: The `docs/` folder contains exceptional, highly detailed technical specifications (`MOBILE_ARCHITECTURE.md`, `HARDWARE_CONTROLS_030.md`, `GUIDANCE_040.md`).
  - *Root "Front-Door" Sanity (Poor)*: The root `README.md` creates severe cognitive friction. It leads with a local MacBook WebRTC browser demo (`app.main:app`), fails to explain why Docker exists, concludes with an unintegrated photo of an STMicroelectronics VL53L9CX ToF LiDAR sensor, and contains literal notes of author confusion regarding version numbers and tokens.
- **Language Barrier**: All core documentation is written exclusively in Vietnamese, with no English architecture overview or visual component topology map.

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
1. **Restructure Root README (Immediate)**: Replace the confusing desktop WebRTC guide with a clear client-server architecture diagram highlighting the Android app (`mobile/`) and FastAPI Docker backend (`app.mobile_api:app`).
2. **Add Reverse Proxy / Rate Limiter (Immediate)**: Place Caddy or Nginx with `limit_req` in front of the container to protect health check and audio upload routes from denial-of-service.
3. **Clarify Project Licensing (Short Term)**: Add an explicit open-source license (e.g. MIT or Apache-2.0) to clarify the rights of contributors and adopters.
4. **Decouple Admission State for Scaling (Medium Term)**: When expanding beyond pilot testing (more than 2 concurrent users), migrate `WorkGate` leases and token state to a shared Redis cluster.
