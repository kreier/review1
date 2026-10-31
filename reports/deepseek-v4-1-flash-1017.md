---
model: "DeepSeek-V4.1-Flash-1017"
model_id: "deepseek-v4-1-flash-1017"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-31"
scores:
  overall: 7.8
  architecture: 8.6
  code_quality: 8.2
  security: 8.0
  documentation: 6.4
summary: "A privacy-conscious, unusually well-threat-modelled assistive Android system for blind Vietnamese users: server-side sherpa-onnx Zipformer STT, Gemini vision behind fail-closed SHA-256 trial tokens, a per-token and two-slot global admission gate, and an Expo/React Native client whose pure TypeScript core enforces HTTPS-only transport, bounded media and screen-reader-aware speech. The engineering of the safety and privacy controls is above pilot grade, but the project is not production-ready: no LICENSE in a public repository, no CI or Python lint/type gate, no dependency hashes, no real-device or blind-user validation, a stale and inconsistent front door, a legacy unauthenticated WebRTC demo with access to the server Gemini key, and a single-process admission model that cannot scale."
key_strengths:
  - "Fail-closed mobile authentication and admission: only SHA-256 token digests are stored, malformed configuration disables the service, comparison uses hmac.compare_digest, request bodies are capped before the multipart parser, and a token gets one lease inside a two-slot WorkGate (app/mobile_security.py:19-46, 76-93, 103-177; app/mobile_api.py:162-183)."
  - "Privacy-preserving media boundary: ASR runs on the operator server with sherpa-onnx, only discrete JPEG snapshots and short M4A clips are accepted, audio is deleted after transcription, cached media is removed on cancel, expiry and background, and Gemini receives image plus transcript with store=false, never audio (app/mobile_pipeline.py:75-120; mobile/src/core/TurnController.ts:246-266; mobile/src/services/media.ts:20-43; app/vision.py:152-207)."
  - "Safety gates treat AI output as an untrusted proposal: the v3 orchestrator owns confirmation, revision, frame deduplication and evidence state; unsafe instructions containing centimetres, multi-press counts, compound actions or a press verb during a locate step are rejected; factory reset, data wipe, purchases and password entry stop before final confirmation; a remote photo cannot prove the target device changed (app/guidance.py:533-535, 540-551, 587-592)."
  - "Layered prompt-injection and SSRF defences: system prompts classify transcripts, OCR text, fetched pages and JSON fields as untrusted; the research fetcher resolves DNS once, requires every answer to be global, pins the returned IP while preserving SNI and Host, allowlists official vendor domains, revalidates each redirect, caps bytes and isolates PDF parsing in a subprocess with RLIMIT_CPU and RLIMIT_AS (app/guidance_search.py:93-194, 280-295; app/guidance_vision.py:16-51)."
  - "Accessibility is engineered rather than decorative: 56dp minimum controls and an 88dp primary action, allowFontScaling, explicit roles and states, screen-reader announcements, the camera preview excluded from the accessibility tree, reduced-motion-aware transitions, and a Kotlin volume-key policy that yields to TalkBack touch and hover, chords, long presses and repeated events (mobile/src/components/ActionButton.tsx:34-42; mobile/src/components/AppText.tsx:16-20; mobile/src/components/StateTransition.tsx:7-14; mobile/src/screens/HomeScreen.tsx:380; HardwareControlsDispatcher.kt:78-122; VolumeKeyPolicy.kt:20-61)."
  - "Unusually deep automated tests for a pilot: 18 Python test modules, 17 Jest suites and 15 Kotlin policy tests assert fail-closed auth, 413-before-parse, private-data-free logs, SSRF rejection, prompt-injection containment, idempotency, revision conflicts, cancellation and lease release, and accessibility labels (tests/test_mobile_api.py:144-220; tests/test_guidance_search.py:56-80; tests/test_guidance.py:91-160; mobile/tests/hardwareControlsNative.test.ts:17-57)."
key_weaknesses:
  - "No LICENSE in a public repository, and the README says the opposite; CC BY-NC-ND 4.0 Zipformer weights are copied into the Docker image at build time, so the redistributable artifact has unresolved licensing and commercial-use constraints (README.md:109-116; Dockerfile:7-8, 24)."
  - "No CI, no Python linter or type checker, no coverage threshold, no dependency hashes or SBOM; checks are a manual shell script, the only tag v0.1.0 points at the 0.4 implementation commit, and git holds only five commits, so the documented 0.1-0.4 history is not reconstructable (scripts/check.sh:1-11; pyproject.toml:1-27; git tag v0.1.0 resolves to 16faf3f)."
  - "The product has never met its users: every row of docs/GUIDANCE_ACCEPTANCE_040.md and docs/ANDROID_ACCEPTANCE.md is marked Chưa thử, including 10 remotes, TalkBack, 200 percent font, 20 turns on two phones, and 5 blind users across 6 tasks at 80 percent completion; synthetic fixtures are explicitly not evidence of device support (docs/GUIDANCE_ACCEPTANCE_040.md:3-15; docs/ANDROID_ACCEPTANCE.md:7-28)."
  - "The front door mixes two products and is internally inconsistent: it advertises a macOS Chrome WebRTC demo and an unintegrated VL53L9CX LiDAR sensor, defaults to gemini-3.8-flash while the release notes say the demo was moved to gemini-3.1-flash-lite, ships temporary trycloudflare URLs, and includes an author note saying they do not know what v0.2.1 through v0.4 did (README.md:16-31, 118-128; docs/RELEASE_040.md:21, 31)."
  - "Two client state machines are maintained but only one runs: HomeScreen hardcodes deviceGuidance true, so the 545-line v2 TurnController and its confirmation and action-menu branches are unreachable in production, while DeviceTaskController exposes compatibility methods that all delegate to start (mobile/src/screens/HomeScreen.tsx:75; mobile/src/hooks/useTurnController.ts:70-72; mobile/src/core/DeviceTaskController.ts:366-371)."
  - "Admission and rate control are process-local: WorkGate is an in-memory dict, Docker runs --workers 1, and there is no per-token request-rate or spend cap, so a second worker or replica, or a valid token issuing serial requests, breaks the one-active-per-token and two-global invariant or can drain Gemini quota (app/mobile_security.py:76-93; Dockerfile:30; docs/ANDROID_SETUP.md:88)."
  - "The ASR and command layer is brittle for the target user: the v3 backend recognises six exact phrases, the release notes already record Bắt đầu hướng dẫn being transcribed as BÁC ĐẦU HƯỚNG DẪN, and there is no fuzzy repair or explicit I-did-not-catch-you recovery path, which is a safety-critical dead end for a blind user (app/guidance_contract.py:53-64; docs/RELEASE_040.md:27)."
security_findings:
  - id: "SEC-DEEPSEEK-001"
    severity: "HIGH"
    status: "verified"
    confidence: 0.98
    category: "licensing"
    title: "Public repository ships no LICENSE while README claims it is private"
    file: "README.md"
    line_start: 114
    line_end: 116
    affected_function: "Repository licensing"
    description: "No LICENSE, COPYING or NOTICE file is tracked. An unauthenticated git ls-remote against origin returned refs/heads/main, refs/heads/ToF and refs/heads/ver1, so the repository is publicly readable. README.md says the licence is still missing and that the repository is private, which is false. Under default copyright a public repository with no licence grants third parties no right to use, modify or redistribute the 13,282 code lines."
    evidence: "README.md:114-116 says the repository licence is still missing and currently a private repository, so of no concern. `git ls-remote --heads origin` without supplying credentials returned refs/heads/main, refs/heads/ToF and refs/heads/ver1. `git ls-files` contains no LICENSE, COPYING or NOTICE path."
    impact: "APEC partners, pilot sites, reviewers, contributors and forkers have no legal grant to use the code. The Apache-2.0 sherpa-onnx runtime also requires licence and NOTICE retention that the repository does not provide."
    recommendation: "Add an Apache-2.0 LICENSE and a NOTICE covering sherpa-onnx and other third-party components, correct the README claim, and record an explicit written decision about the CC BY-NC-ND model weights."
  - id: "SEC-DEEPSEEK-002"
    severity: "HIGH"
    status: "probable"
    confidence: 0.9
    category: "auth"
    title: "Legacy WebRTC demo is unauthenticated and proxies the operator Gemini key"
    file: "app/main.py"
    line_start: 65
    line_end: 121
    affected_function: "create_offer"
    description: "app.main:app exposes WebRTC signalling, image, audio and ZIP retrieval and Gemini-backed analysis with no authentication, no rate limiting, one global session, and no explicit size cap on the SDP payload. create_offer holds session_lock while waiting up to 15 seconds for ICE gathering, so one request stalls every other offer. The only control is a README sentence telling operators not to expose it, while the same repository ships a full requirements.txt that makes running the demo easy."
    evidence: "app/main.py:65 declares `@app.post('/api/webrtc/offer')` with no auth dependency; app/main.py:152-183 calls vision.analyze with the server-side GEMINI_API_KEY; app/main.py:144-203 returns the active session image, audio and ZIP; app/main.py:75-82 holds session_lock across setRemoteDescription and up to 15 seconds of ICE gathering; README.md:16 only warns not to put app.main:app on the Internet."
    impact: "If bound to 0.0.0.0 or tunnelled like the mobile API already is, any stranger can burn the operator paid Gemini quota, read the active user photo, audio, transcript and export bundle, and exhaust CPU or file descriptors with unthrottled offers."
    recommendation: "Remove the demo from the deployable image and public requirements, or add Bearer authentication, loopback binding at the socket level, per-IP rate limiting and a body cap; separate demo dependencies from the mobile runtime."
  - id: "SEC-DEEPSEEK-003"
    severity: "HIGH"
    status: "verified"
    confidence: 0.95
    category: "licensing"
    title: "CC BY-NC-ND 4.0 Zipformer weights are baked into the distributable container image"
    file: "Dockerfile"
    line_start: 7
    line_end: 24
    affected_function: "model build and runtime stages"
    description: "The model stage downloads hynt/Zipformer-30M-RNNT-Streaming-6000h into /opt/zipformer and the runtime stage copies it in, so every built image redistributes the weights. README.md states the weights are CC BY-NC-ND 4.0; NC forbids commercial use, ND forbids distributing modified or derivative weights including quantisation and fine-tuning needed for latency work, and attribution terms are not packaged as a NOTICE."
    evidence: "Dockerfile:7 runs `python scripts/download_model.py --model-dir /opt/zipformer`; Dockerfile:24 copies `/opt/zipformer` into the runtime image; model_config.json:2 pins `hynt/Zipformer-30M-RNNT-Streaming-6000h`; README.md:109 states CC BY-NC-ND 4.0 and README.md:112 warns not to relicense the weights."
    impact: "A funded or paid pilot, or pushing the image to any registry, is a licence violation; model optimisation is foreclosed because a quantised or fine-tuned derivative cannot be distributed."
    recommendation: "Keep weights out of the image and download or mount them at runtime under the operator own licence acceptance; package attribution and NOTICE material; evaluate a permissively licensed Vietnamese ASR model for any commercial path."
  - id: "SEC-DEEPSEEK-004"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.9
    category: "network"
    title: "Gemini client honours proxy environment variables and can send the API key through an unintended proxy"
    file: "app/vision.py"
    line_start: 218
    line_end: 226
    affected_function: "_request"
    description: "GeminiVisionProvider builds an httpx.AsyncClient without trust_env=False, so httpx honours HTTPS_PROXY, ALL_PROXY, SSL_CERT_FILE and related environment variables. The Gemini API key is sent in the x-goog-api-key header. The research fetcher deliberately sets trust_env=False in two places, so the egress policy is inconsistent; a compromised or misconfigured proxy environment can route the key, image and transcript through an unintended intermediary."
    evidence: "app/vision.py:221 creates `httpx.AsyncClient(timeout=self._timeout, transport=self._transport)` without trust_env=False; app/vision.py:224 sends `headers={'x-goog-api-key': self._api_key}`; app/guidance_search.py:159 and app/guidance_search.py:230 explicitly set trust_env=False."
    impact: "A server-side environment compromise or platform misconfiguration can expose the Gemini key and user media to a proxy, and egress becomes non-deterministic across deployments."
    recommendation: "Pass trust_env=False to the Gemini client, document the required egress path, and add a regression test with proxy environment variables set; consider a dedicated egress client or allowlist."
  - id: "SEC-DEEPSEEK-005"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.92
    category: "availability"
    title: "Admission control is process-local and breaks when the service scales beyond one worker"
    file: "app/mobile_security.py"
    line_start: 76
    line_end: 93
    affected_function: "WorkGate"
    description: "WorkGate is an in-memory dict of leases with capacity 2 and one identity per token. The Docker image runs uvicorn with --workers 1 and the Cloud Run reference uses --max-instances 1; the documentation itself notes that multiple replicas need shared admission. Any horizontal scale-out, or an accidental --workers 2, gives each process its own gate, so the documented one-active-per-token and two-global-AI-job limits no longer hold."
    evidence: "app/mobile_security.py:79-88 stores leases in a local dict and checks `len(self._leases) >= self.capacity or identity in self._leases`; Dockerfile:30 runs `--workers 1`; docs/ANDROID_SETUP.md:88 says multiple replicas need shared admission."
    impact: "Under scale-out one token can run multiple concurrent AI jobs, and the operator can exceed the intended Gemini concurrency and cost envelope; CPU and STT contention and quota exhaustion become possible."
    recommendation: "Move admission to a shared atomic store such as Redis with a per-token lease and a global semaphore, or enforce a single instance and fail startup when workers exceed one; add a regression test with two app instances sharing one gate."
  - id: "SEC-DEEPSEEK-006"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.9
    category: "credentials"
    title: "Static bearer tokens have no expiry, rotation or per-token request quota"
    file: "app/mobile_security.py"
    line_start: 19
    line_end: 46
    affected_function: "TrialTokens"
    description: "Trial tokens are 256-bit random values, but the server stores only SHA-256 digests with no issued_at, expiry, label or usage counter. Revocation requires editing TRIAL_TOKEN_HASHES and restarting the process. There is no per-token request-rate or spend cap; the gate only limits concurrent jobs. A leaked token therefore remains valid indefinitely and can serially consume Gemini quota until an operator notices and restarts."
    evidence: "app/mobile_security.py:19-27 stores only a tuple of 64-hex digests; app/mobile_security.py:37-46 hashes the presented token and compares; docs/ANDROID_SETUP.md:28-35 describes revocation by deleting the hash and restarting; app/mobile_security.py:76-88 limits concurrency rather than request rate."
    impact: "Lost or stolen tester tokens grant indefinite access; there is no per-user audit trail or spend attribution; incident response requires a full process restart."
    recommendation: "Store token metadata including label, issued_at, expires_at, last_used and request_count; enforce expiry and a per-token rate or spend budget; support revocation without restart through a Redis denylist; log a token identifier, never the token."
  - id: "SEC-DEEPSEEK-007"
    severity: "LOW"
    status: "verified"
    confidence: 0.85
    category: "supply_chain"
    title: "Dependencies are version-pinned but not hash-locked and there is no CI vulnerability gate"
    file: "requirements.txt"
    line_start: 1
    line_end: 56
    affected_function: "build dependencies"
    description: "requirements.txt and requirements-mobile.txt pin versions but contain no require-hashes directives; the Docker base images are pinned by tag rather than digest; there is no GitHub Actions workflow, pip-audit, npm audit, osv-scanner, Dependabot, Renovate or SBOM generation. scripts/check.sh only runs tests, compileall, a JavaScript syntax check and TypeScript and Jest. A mutable dependency or base-image tag can enter the build without an automated CVE or provenance gate."
    evidence: "requirements.txt:1-56 lists exact versions but no hashes; Dockerfile:1 and Dockerfile:10 use tag-only base images; scripts/check.sh:5-10 runs pytest, compileall, node --check, typecheck and Jest only; the only YAML workflow found is mobile/.eas/workflows/repack-android.yml."
    impact: "A compromised or vulnerable dependency can ship unnoticed; builds are not bit-reproducible; there is no machine-readable SBOM for a safety-critical assistive product."
    recommendation: "Use a lockfile with hashes via uv or pip-tools, pin image digests, add CI with pip-audit, npm audit and osv-scanner plus an SBOM such as CycloneDX or Syft, and enable automated dependency updates."
  - id: "SEC-DEEPSEEK-008"
    severity: "LOW"
    status: "probable"
    confidence: 0.72
    category: "network"
    title: "Admin localhost check is address-based and can be bypassed by a local reverse proxy or tunnel"
    file: "app/guidance_admin.py"
    line_start: 74
    line_end: 83
    affected_function: "local_only"
    description: "The admin app allows requests only when the Host header hostname is 127.0.0.1, localhost or ::1 and request.client.host is loopback or testclient. This is correct for direct localhost use, but it cannot distinguish a local browser from a reverse proxy or tunnel that terminates on loopback and forwards a remote request with a spoofed Host header. The documentation explicitly forbids tunnelling the admin port, but a single operator mistake would expose the admin surface."
    evidence: "app/guidance_admin.py:82 checks `if hostname not in {'127.0.0.1','localhost','::1'} or client not in {'127.0.0.1','::1','testclient'}`; docs/GUIDANCE_040.md:45 says not to forward the admin page, PostgreSQL or Redis."
    impact: "Misconfiguration could expose the knowledge-approval UI; the login secret and CSRF and session controls still apply, but the attack surface and credential-phishing risk increase."
    recommendation: "Bind the admin listener to loopback at the socket level or use a Unix socket, reject forwarded headers, and add a deployment check that the admin port is unreachable through the mobile tunnel."
---

# Technical Review Report: APEC Mắt Kính Cho Người Khiếm Thị

**Reviewed target:** `target/APEC_mat_kinh_cho_nguoi_khiem_thi` at commit `d9ba1e0d42e1241471b1fb58df1efb9d345c6721` (2026-10-28).
**Review date:** 2026-10-31.
**Reviewer:** DeepSeek-V4.1-Flash-1017.
**Boundary:** This report assesses only the external codebase in `target/`. The `review1` harness was not reviewed. No target files were modified.

---

## 1. Executive Summary and Readiness Verdict

The target is **Mắt Kính**, an Android assistive application for blind and low-vision Vietnamese users. The shipped product is not a pair of smart glasses; it is a phone application that captures a rear-camera still image, accepts a spoken question, sends a bounded JPEG and M4A clip over HTTPS to an operator-run FastAPI service, transcribes the audio with a server-side Zipformer model, asks Google Gemini about the image plus transcript, and speaks the Vietnamese answer through the device TTS engine or TalkBack. A newer v3 flow adds a stateful remote-control guidance loop that can ask for additional photos, demand model-label evidence, and verify a target-device screen before declaring a step complete.

The engineering is genuinely stronger than the typical pilot. Authentication is fail-closed, only token digests are stored, request bodies are capped before multipart parsing, concurrency is bounded by a per-token and global admission gate, audio is never sent to Gemini, media is not persisted as history, and the v3 orchestrator treats model output as an untrusted proposal rather than an instruction. The accessibility work is also real: touch targets are large, text scales, the camera preview is hidden from the accessibility tree, and the native volume-key policy explicitly yields to TalkBack gestures and Android system shortcuts.

The project is nevertheless **not production-ready** and should be treated as a **supervised field pilot only**:

- There is **no LICENSE** in a repository that is publicly readable, while the README claims the opposite. The CC BY-NC-ND 4.0 Zipformer weights are baked into the container image.
- There is **no CI**, no Python linter or type checker, no coverage threshold, no dependency hashing and no SBOM. The only release tag, `v0.1.0`, points at the 0.4 implementation commit.
- **No real device or blind user has completed the acceptance checklist.** Every row in the guidance and Android acceptance tables is still `Chưa thử` (not tested).
- A **legacy WebRTC demo** remains in the same repository with no authentication and access to the server's paid Gemini key. It is documented as local-only, but it is one operator mistake away from exposure.
- The **front door is inconsistent**: it mixes a macOS Chrome demo, an unintegrated LiDAR sensor, a stale model default and temporary tunnel URLs.

### Scorecard

| Dimension | Score | Rationale |
|---|---:|---|
| Overall | **7.8** | Strong safety and privacy engineering, weak release engineering and zero user validation. |
| Architecture | **8.6** | Clear client/server split, explicit v2 and v3 boundaries, layered security and guidance modules. Two server entry points and two client state machines add debt. |
| Code quality | **8.2** | Strict TypeScript, typed Python, small focused modules and strong validation; but no Python static analysis, no linting, dead v2 client path, broad exception boundaries and some large orchestrator functions. |
| Security | **8.0** | Excellent auth, input, SSRF and prompt-injection controls; legacy demo, static token lifecycle, proxy-env egress, process-local admission and licensing gaps pull the score down. |
| Documentation | **6.4** | Extensive Vietnamese docs and acceptance checklists, undermined by a misleading front door, stale links, model-version drift, a mispointed tag and no licence. |

### Readiness tiers

| Tier | Verdict |
|---|---|
| Local developer demo | Ready, with the explicit caveat that `app.main:app` must never be exposed. |
| Supervised pilot with known testers | Conditional. Technically credible, but only after the licence, legacy demo and real-device checklist are resolved. |
| Unsupervised use by blind users | Not ready. No real-user validation, no production identity lifecycle, no device matrix, and no continuous monitoring. |
| Commercial deployment | Blocked by the CC BY-NC-ND weights and the absent repository licence. |

---

## 2. Project Identity, Purpose and Hardware Reality Check

### 2.1 Problem domain and audience

The application addresses a real accessibility problem: a blind or low-vision user wants to ask about what is in front of them, read a label, locate an object, or receive step-by-step help operating a TV or air-conditioner remote. The interface is deliberately voice-first and hardware-key-friendly because touch-screen exploration is slow and error-prone for the target user.

The domain vocabulary is Vietnamese: `Bắt đầu nói`, `Chụp và gửi`, `Đã làm`, `Chưa tìm thấy`, `Nghe lại bước này`, `Đổi mục tiêu`, `Hủy hướng dẫn`. The documentation, error messages, tests and prompts are consistently in Vietnamese, which is appropriate for the intended pilot audience.

### 2.2 What the repository actually ships

There are three operational surfaces:

1. **`app.mobile_api:app`** — the production mobile API (v2 analysis and transcription, v3 guidance routes). Documented as the only backend that may be public (`README.md:16`).
2. **`app.main:app`** — a legacy local WebRTC demo with a browser UI under `web/`. It captures one photo and one audio clip, transcribes locally, optionally calls Gemini, and can export a ZIP. It is explicitly local-only.
3. **`app.guidance_admin:app`** — a localhost-only knowledge-approval UI for device manuals, separate from the mobile API.

The Android application lives in `mobile/` and is built with Expo SDK 57 and React Native 0.86.3. The APK is built through EAS, not through the Python Docker image.

### 2.3 Hardware reality vs aspirational claims

The repository name and README use **Mắt Kính** (glasses), but the operational product is a **phone app**. There is no glasses hardware, no head-mounted display, no camera bridge and no wearable integration in the codebase.

The README has a section titled **LIDAR sensor ST Electronics VL53L9CX** with a marketing image and a note that software has to analyse it (`README.md:118-124`). A repository-wide search finds `VL53`, `LiDAR` and `ToF` only in `README.md:118-124`; there is no driver, parser, distance pipeline, calibration file or test. The sensor is aspirational, not integrated.

The hardware-control feature is real but limited: the Kotlin Expo module intercepts short volume-up and volume-down presses while the assistant screen is in the foreground. It deliberately does **not** create an accessibility service, foreground service or media session. The docs describe headset/BLE integration as a future step and confirm that no BLE or media-session adapter exists (`docs/HARDWARE_CONTROLS_030.md:37-43`; `docs/IMPLEMENTATION_STATUS.md:64`). The `ControlSource` type includes `headset` (`mobile/src/core/controlInput.ts:2`), but there is no production adapter that emits it.

**Verdict:** the product identity should be described as an Android assistive app with optional phone volume-key control, not as smart glasses or a LiDAR wearable.

### 2.4 Maintenance status and maturity

The target has five commits between 2026-09-28 and 2026-10-28, from two contributors:

| Metric | Value |
|---|---|
| Commits | 5 |
| Contributors | 2 (`Matthias Kreier`, `thanh1912-ut`) |
| Branches | `main`, `ToF`, `ver1` |
| Tags | `v0.1.0` only |
| Tag target | `16faf3f` — the commit titled *Implement Mat Kinh 0.4 Android device guidance* |
| Tracked paths | 142 |
| Analyzer count | 138 files, 34 directories, 27,525 lines |

The single tag is mispointed: `v0.1.0` resolves to `16faf3f`, which is the 0.4 implementation commit, not the 0.1.0 release. The documented 0.1.0 through 0.4.0 releases therefore cannot be reconstructed from tags or a meaningful commit history. This is a release-integrity problem, not merely a documentation gap.

---

## 3. Technology Stack and Runtime Compatibility

### 3.1 Stack inventory

| Layer | Technology | Version / note |
|---|---|---|
| Backend runtime | Python | 3.11 only (`requires-python >=3.11,<3.12`); Docker uses `python:3.11.16-slim-bookworm` |
| Web framework | FastAPI | 0.117.1, Starlette 0.48.0, Uvicorn 0.36.0 |
| ASR | sherpa-onnx | 1.13.8 with `hynt/Zipformer-30M-RNNT-Streaming-6000h` at revision `c122fdc21cea4894fd775e9d3fe66ebbc787e26b` |
| Vision | Google Gemini Interactions API | Default `gemini-3.8-flash`; demo release notes say the live demo was switched to `gemini-3.1-flash-lite` |
| Media | PyAV 17.1.0, Pillow 11.3.0, NumPy 2.3.3 | M4A/AAC decode to mono 16 kHz; JPEG validation |
| Persistence | PostgreSQL via psycopg 3.3.6; Redis via redis 8.1.0 | v3 guidance task state and knowledge profiles only; no media |
| Search | Brave Search API; pypdf 6.20.1 | Opt-in, requires key and storage-rights confirmation |
| Mobile | Expo SDK 57.0.26, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3 | Android pilot; iOS configured but not the target |
| Mobile native | Kotlin Expo module | Volume-key policy and MainActivity plugin |
| Mobile tests | Jest 29.7.0, jest-expo 57.0.5, Testing Library 13.3.3 | 17 suites |
| Backend tests | pytest 8.4.2, pytest-anyio, TestClient, httpx MockTransport | 18 modules |
| Container | Docker multi-stage | model build stage plus non-root runtime user 10001 |
| Packaging | EAS Build | `preview` APK profile, versionCode 8, package `com.apec.matkinh.pilot` |

### 3.2 Declared vs actually used dependencies

- `requirements.txt` is a full freeze-style list (47 packages plus guidance persistence packages). It includes `aiortc`, `aioice`, `pylibsrtp` and `pyOpenSSL` for the WebRTC demo.
- `requirements-mobile.txt` is the minimal mobile runtime and deliberately excludes WebRTC. The Dockerfile installs only this file, which is correct for the mobile API.
- `pyproject.toml` lists direct dependencies with exact versions, but has no `[tool.*]` sections: no ruff, black, mypy, pytest or coverage configuration.
- The mobile `package-lock.json` is present. The Python side has no lockfile with hashes.
- `model_config.json` pins the Hugging Face revision and lists the four required files. `scripts/download_model.py` verifies cached SHA-256 hashes when a manifest is present.

### 3.3 Runtime compatibility notes

- The Python code uses `StrEnum` (`app/session.py:12`), so Python 3.11 is genuinely required; the constraint is not arbitrary.
- The PDF isolation worker imports `resource` and sets `RLIMIT_CPU`/`RLIMIT_AS` (`app/guidance_search.py:280-295`), which is Unix-only. Docker and the documented macOS environment work; native Windows development would fail PDF extraction.
- The mobile app requires Node.js 22.13 or later according to `docs/ANDROID_SETUP.md:41`, but `mobile/package.json` has no `engines` field. The build contract is documentation-only.
- `minSdkVersion 29`, `usesCleartextTraffic: false`, `allowBackup: false` and a narrowed permission set are configured in `mobile/app.config.ts:11-31`. This is a good Android hardening baseline.

---

## 4. Quantitative Scope and Deterministic Metrics

The following figures come from `target-metrics.json` (analyzer version 2.0.0, analysed 2026-10-30). They are the deterministic ground truth for this report; no line counts were guessed.

### 4.1 Repository size

| Metric | Value |
|---|---:|
| Total files | 138 |
| Total directories | 34 |
| Total lines | 27,525 |
| Code lines | 13,282 |
| Comment lines | 254 |
| Blank lines | 1,765 |
| Documentation lines | 627 |
| Data lines | 11,597 |

The data-heavy total is expected: the two `package-lock.json` files and other JSON account for 11,552 data lines. The executable core is roughly 13.3k lines, of which Python and TypeScript dominate.

### 4.2 Language breakdown

| Language | Files | Total lines | Code lines | Comment lines | Category |
|---|---:|---:|---:|---:|---|
| Python | 39 | 6,952 | 5,729 | 186 | code |
| TypeScript | 37 | 3,951 | 3,700 | 44 | code |
| TypeScript (React) | 14 | 1,890 | 1,747 | 7 | code |
| CSS | 1 | 759 | 758 | 0 | code |
| JavaScript | 4 | 714 | 671 | 1 | code |
| Kotlin | 4 | 385 | 333 | 12 | code |
| HTML | 1 | 127 | 122 | 0 | code |
| Markdown | 15 | 841 | 0 | 0 | doc |
| JSON | 7 | 11,552 | 0 | 0 | data |
| SQL | 1 | 44 | 0 | 0 | data |
| Dockerfile / TOML / YAML / Gradle / Shell / `.example` | 9 | 144 | 113 | 4 | config/code |

The comment ratio is low (254 comment lines against 13,282 code lines), but this is partly an analyzer artefact: Python docstrings and TypeScript type names carry much of the intent. The code is generally readable, but a public safety-critical project should still have a stated docstring/comment policy.

### 4.3 Test inventory

The deterministic file inventory lists:

- **18 Python test modules** under `tests/` covering the mobile API, pipeline, vision, ASR, sessions, WebRTC, bundle, model download, guidance API, guidance admin, mobile compatibility, guidance search, guidance storage, trial tokens, and the evaluation script.
- **17 Jest suites** under `mobile/tests/` plus two component suites, including controllers, API clients, media, speech, hardware controls, recovery, and screens.
- **1 Kotlin suite** (`VolumeKeyPolicyTest.kt`) with 15 `@Test` methods.

`docs/RELEASE_040.md:25` reports 322 Python tests and 329 mobile tests after parametrisation. The raw `def test_` and `it/test` counts in this checkout are 158 and 188 respectively, which is consistent with parametrised expansion. The exact pass/fail state was not re-run in this review, because the report is a static code and documentation assessment.

### 4.4 Security-flag triage

`target-metrics.json` reports five `MEDIUM` heuristic "Hardcoded Credentials in Assignment" flags:

- `tests/test_evaluate_mobile.py`
- `tests/test_guidance.py` (two entries)
- `tests/test_mobile_vision.py`
- `tests/test_vision.py`

These are credential-shaped **test fixtures**, not live credentials. For example, `tests/test_mobile_api.py:24` defines a synthetic trial token for an in-memory TestClient. No tracked `.env` file exists; `.env` and `pilot-token*.txt` are ignored. The flags should be allowlisted or replaced with generated constants so real secret-scanning signal is not diluted. No live API key or production token was found in tracked target files.

---

## 5. Repository Structure and Architecture

### 5.1 Directory layout

```text
app/                     Python backend
  main.py                legacy WebRTC demo entry point
  mobile_api.py          production v2 mobile API (analysis, transcription)
  mobile_security.py     token hashing, admission middleware, WorkGate
  mobile_pipeline.py     image validation, audio decode, ASR and Gemini call
  asr.py                 Zipformer model manager and inference lock
  vision.py              Gemini Interactions client and response validation
  session.py             legacy WebRTC session state machine
  bundle.py              WAV, manifest and ZIP construction
  guidance_api.py        v3 authenticated routes
  guidance.py            v3 orchestrator (state, evidence, revision, safety)
  guidance_contract.py   commands, limits, identity normalisation, types
  guidance_storage.py    Redis task store and PostgreSQL knowledge repository
  guidance_search.py     bounded official-document research and SSRF controls
  guidance_vision.py     Gemini guidance prompt and strict response schema
  guidance_admin.py      localhost-only knowledge review UI
mobile/                  Expo / React Native Android app
  src/core/              pure TypeScript controllers, commands, settings, types
  src/services/          API, guidance API, media, speech, hardware, recovery
  src/hooks/             React hooks wiring controllers and native modules
  src/screens/           HomeScreen and SettingsScreen
  src/components/        accessibility primitives
  modules/mat-kinh-controls/  Kotlin volume-key module and tests
web/                     legacy browser WebRTC UI
tests/                   pytest suites
migrations/              PostgreSQL schema
scripts/                 model download, token creation, migration, checks
docs/                    Vietnamese design, release and acceptance documents
```

### 5.2 Architectural layers and boundaries

The backend is best described as a **modular monolith with a hard client/server boundary**:

1. **Transport and admission layer** — `MobileAdmissionMiddleware` and `GuidanceAdmissionMiddleware` authenticate before parsing, cap body size, apply per-token leases, and reject unready services (`app/mobile_security.py:95-186`; `app/guidance_api.py:17-64`).
2. **Input validation layer** — multipart shape, field uniqueness, MIME, byte caps, image decode, audio decode and 60-second sample cap (`app/mobile_api.py:61-151`; `app/mobile_pipeline.py:71-136`).
3. **Domain pipeline** — ASR and vision for v2; a stateful guidance orchestrator for v3 (`app/mobile_pipeline.py`; `app/guidance.py`).
4. **Persistence and integration layer** — Redis task facts, PostgreSQL knowledge profiles, Gemini and optional Brave Search (`app/guidance_storage.py`; `app/guidance_search.py`; `app/vision.py`).
5. **Client layer** — pure TypeScript controllers, service adapters, React screens and a native Kotlin module.

The v2/v3 split is deliberate. The v2 API is stateless between requests: the client sends the same JPEG again for a follow-up and sends a bounded context array. The v3 API is stateful: it creates a task, stores revisions and operations in Redis, and returns accepted operation IDs for polling. This is a sensible evolution, but maintaining both paths costs code and test surface.

### 5.3 Server entry points and production boundary

There are two independent ASGI apps:

- `app.mobile_api:app` — production. It disables FastAPI docs, ReDoc and OpenAPI (`app/mobile_api.py:176`), mounts only `/api/health`, `/api/v2/analyze`, `/api/v2/transcribe`, and the v3 guidance routes. It does not mount the legacy web UI, WebRTC, sessions, ZIP export or docs.
- `app.main:app` — legacy local demo. It serves the browser UI, WebRTC signalling, session media, ZIP export and analysis. It has no authentication.

The Dockerfile builds only `app/mobile_api:app` (`Dockerfile:30`). `app.main:app` is therefore not part of the production container, which is the right boundary. The problem is that the legacy demo remains easy to run and shares the same Gemini key configuration.

### 5.4 Client architecture

The mobile client has a useful separation:

- **Pure controllers** (`TurnController`, `DeviceTaskController`) own state transitions and are testable without React Native.
- **Hooks** (`useTurnController`, `useHardwareControls`, `useSettings`) wire native media, permissions, AppState and SecureStore.
- **Services** isolate HTTP, media transformation, speech and recovery.
- **Components** centralise accessibility semantics and touch size.

This is a clean design. Its main flaw is that the production screen hardcodes `deviceGuidance: true` (`mobile/src/screens/HomeScreen.tsx:75`), so the v2 controller is dead in production while still consuming 545 lines and a large test suite.

### 5.5 Design patterns and maintainability

Positive patterns:

- **Fail-closed defaults** in token configuration and readiness.
- **Policy objects** for volume-key gestures (pure Kotlin policy with explicit bypass rules).
- **Generation counters** in both client controllers to reject late camera, STT and network results.
- **Idempotency fingerprints** and revision checks in the v3 orchestrator.
- **Strict response schemas** for Gemini output, with duplicate-key rejection and bounded strings.

Debt:

- Two client state machines, one unused in production.
- Private-method coupling: `guidance_vision.py:140` calls `GeminiVisionProvider._request` and `_response_text`, which are private methods of another module.
- Duplicate error taxonomies between v2 and v3.
- Large functions in `app/guidance.py` (`_evaluate` spans roughly 113 lines) and `DeviceTaskController.runAttempt` (roughly 94 lines).
- No Python static analysis to keep the type hints honest.

---

## 6. Media, AI and Data-Flow Disambiguation

### 6.1 Modality map

| Stage | v2 analysis | v2 transcription | v3 guidance | Legacy demo |
|---|---|---|---|---|
| Visual input | One JPEG still, max 2 MiB, max side 1280 px | None | One JPEG still, max 2 MiB, max side 2048 px | One JPEG still, max 2 MiB, max side 1280 px |
| Audio input | One M4A/AAC clip, max 2 MiB and 60 s decoded | Same | Audio is first sent to `/api/v2/transcribe`, then only the transcript goes to v3 | WebRTC audio track, resampled to 16 kHz |
| ASR location | Operator server CPU, sherpa-onnx Zipformer | Same | Same | Operator server CPU |
| Vision location | Google Gemini cloud API | None | Google Gemini cloud API | Google Gemini cloud API |
| Vision payload | JPEG plus question/transcript | None | JPEG plus transcript, task state and optional approved knowledge | JPEG plus transcript |
| Audio sent to Gemini | Never | Never | Never | Never |
| TTS location | Device OS TTS or TalkBack | None | Device OS TTS or TalkBack | Browser speech synthesis |
| Persistence | None; request-scoped RAM | None | Redis task facts and operation results; no media | RAM session only |
| Streaming | No; discrete snapshot | No | No; discrete snapshots | No; one photo and one audio clip |

### 6.2 Snapshots, not continuous streaming

The mobile app uses `CameraView` in `mode="picture"` and calls `takePictureAsync` on demand (`mobile/src/screens/HomeScreen.tsx:381`; `mobile/src/screens/HomeScreen.tsx:67-74`). There is no frame loop, no object tracking and no background camera. The WebRTC demo also captures a single JPEG and a single audio clip per turn (`web/app.js:4-15`; `app/session.py:124-180`).

This is an important safety and privacy property: the system is not a continuous navigation aid. It cannot detect a moving obstacle between snapshots, and the documentation correctly warns that one image cannot establish a safe path (`README.md:31`; `docs/VOICE_CONTEXT_020.md:18`).

### 6.3 Audio input vs audio output

- **Input:** speech-to-text. Audio is recorded as M4A/AAC, capped at 2 MiB and 60 seconds of decoded samples, and transcribed by the server-side Zipformer. The ASR model is local to the operator server, not a third-party cloud.
- **Output:** text-to-speech. The app uses the Android TTS engine through `expo-speech`, or routes the answer to `AccessibilityInfo.announceForAccessibility` when TalkBack is active, avoiding double speech (`mobile/src/services/speech.ts:9-25`).

There is no cloud TTS, no continuous listening, no background recording and no environmental sound classification. The README explicitly says STT does not recognise car horns or classify environmental audio (`README.md:81`).

### 6.4 Where models run and what leaves the boundary

- **Zipformer:** on the operator server CPU. The model is pinned to a Hugging Face revision and loaded by `sherpa_onnx.OnlineRecognizer` (`app/asr.py:26-63`). Inference is serialised by a thread lock (`app/asr.py:74-92`).
- **Gemini:** Google's cloud API. The server sends the current JPEG and the text question/transcript; it does not send audio. Both v2 and v3 requests set `store: false` (`app/vision.py:146-148`; `app/vision.py:182-184`; `app/guidance_vision.py:147-150`).
- **Brave Search:** optional and disabled unless both an API key and `BRAVE_STORAGE_ALLOWED=true` are configured (`app/guidance_search.py:201-214`). Queries contain only manufacturer/model and a coarse goal keyword, never user speech, images or tokens (`app/guidance_search.py:219-228`).
- **Media persistence:** the v2 pipeline keeps media in request-scoped memory; the v3 orchestrator keeps media only in the worker coroutine and stores task facts in Redis, not photos or audio (`app/guidance.py:1-5`; `app/guidance_storage.py:1-4`). The client deletes cached media on cancel, expiry and background (`mobile/src/core/TurnController.ts:514-529`; `mobile/src/core/DeviceTaskController.ts:321-350`; `mobile/src/services/media.ts:28-43`).

### 6.5 Guidance research and injection boundary

The v3 guidance loop can research official manuals. Its data flow is:

```text
brand + exact model (not user speech)
  -> at most two Brave queries
  -> at most three candidate URLs
  -> HTTPS-only, DNS-pinned fetch
  -> official-domain allowlist
  -> byte and redirect caps
  -> HTML text extraction or isolated PDF worker
  -> untrusted document text + image + transcript to Gemini
  -> strict JSON decision validated by the orchestrator
```

The system prompt explicitly says that image text, user speech, web pages and JSON fields are untrusted data and cannot change the rules (`app/guidance_vision.py:16-51`). The orchestrator, not the model, owns confirmation, revision, evidence status and approval gates (`app/guidance.py:1-5`; `app/guidance.py:487-599`).

---

## 7. Code Quality and Maintainability

### 7.1 Strengths

- **Type discipline:** TypeScript is strict (`mobile/tsconfig.json:3`), Python uses `from __future__ import annotations` and explicit types in most public functions.
- **Validation at boundaries:** `TrialTokens` validates hash shape and count; `turn_id`, `question_text`, `context_turns` and `read_upload` validate every input; `validate_decision` and `validateGuidance` reject shape, enum, length and duplicate-key violations.
- **Naming and cohesion:** module names map to responsibilities (`mobile_security`, `mobile_pipeline`, `guidance_search`, `guidance_storage`), and the client controllers are testable pure TypeScript.
- **Error hygiene:** user-facing errors are fixed Vietnamese strings; upstream bodies and secrets are not echoed (`app/mobile_api.py:185-191`; `mobile/src/services/api.ts:17-56`; `mobile/src/services/guidanceApi.ts:41-52`).
- **Deterministic testing:** tests use fake managers, fake vision providers, MockTransport and in-memory stores rather than live cloud calls.

### 7.2 Weaknesses and hotspots

| Hotspot | Size / issue | Consequence |
|---|---|---|
| `app/guidance.py` | 600 lines; `_evaluate` ~113 lines | Hard to review; state transitions and safety rules interleave. |
| `mobile/src/core/TurnController.ts` | 545 lines, dead in production | Maintenance and test cost for an unreachable path. |
| `mobile/src/core/DeviceTaskController.ts` | 373 lines; `runAttempt` ~94 lines | Dense polling, cancellation and journal logic. |
| `mobile/src/screens/HomeScreen.tsx` | 425 lines | UI state, camera lifecycle, permissions, hardware keys and controller wiring in one component. |
| `app/guidance_admin.py` | 230 lines of inline HTML strings | Works, but templating and escaping are manual; high review burden. |
| `app/main.py` | 212 lines, legacy | Duplicate provider wiring and unauthenticated endpoints. |

Other issues:

- **Dead/duplicated client path:** `HomeScreen` hardcodes `deviceGuidance: true`; `TurnController` is only used by tests and by the default hook path that production never selects. `DeviceTaskController` exposes `confirmQuestion`, `listenConfirmation`, `openActionMenu`, `listenActionMenu`, `repeatQuestion` and `followUp` as wrappers around `start()` (`mobile/src/core/DeviceTaskController.ts:366-371`). This keeps the shared screen compiling but obscures the real interaction model.
- **Private-method coupling:** the guidance provider calls `GeminiVisionProvider._request` and `_response_text`, so refactoring the base provider can break guidance silently.
- **Broad exception boundaries:** `app/mobile_api.py:232-235`, `app/guidance.py:279-298` and `app/main.py` catch `Exception` and map to a generic error. This is safe for users but can hide programming errors; log fixed diagnostic codes help, but there is no structured exception-type metric.
- **No Python static analysis:** there is no ruff, flake8, mypy, pyright, black or isort configuration. The type hints are not mechanically enforced.
- **No linting or formatting gate on the mobile side:** TypeScript strict mode is good, but there is no ESLint configuration and no Prettier check.
- **No coverage measurement:** Jest and pytest run, but there is no coverage report or threshold.
- **Hardcoded Vietnamese strings:** appropriate for the pilot, but there is no i18n layer; reuse outside Vietnam would require a string extraction pass.

### 7.3 Complexity assessment

The backend's highest-complexity code is the guidance orchestrator, which is expected for a stateful safety loop. The client's highest-complexity code is the recording/camera/network lifecycle, which is inherently asynchronous. Neither is unmaintainable, but both would benefit from extraction:

- Extract guidance phases (`confirm_goal`, `identify`, `step`, `completed`, `cancelled`) into explicit transition functions or a small state machine.
- Extract the media lifecycle from `HomeScreen` into a `useCameraSession` hook.
- Remove or archive the v2 `TurnController` once the v3 path is the only product path, or keep it behind an explicit feature flag and document why.

---

## 8. Dependencies and Supply Chain

### 8.1 Pinning and reproducibility

- Python direct and transitive packages are version-pinned in `requirements.txt` and `requirements-mobile.txt`, but there is no hash-locking and no `uv.lock`, `poetry.lock` or `Pipfile.lock`.
- The Docker base image is pinned by tag (`python:3.11.16-slim-bookworm`) rather than by digest.
- The mobile dependencies are locked by `mobile/package-lock.json`, which is good.
- The ASR model is pinned to a 40-character Hugging Face revision and the download script verifies cached file SHA-256 values (`scripts/download_model.py:26-74`). This is a strong supply-chain practice for the model.
- The container is not bit-reproducible: apt packages are installed without version pins, and the base image tag can move.

### 8.2 Vulnerability and provenance tooling

There is no CI pipeline and no automated vulnerability scan. `scripts/check.sh` runs tests and syntax checks only. There is no `pip-audit`, `npm audit`, `osv-scanner`, `semgrep`, `bandit`, `gitleaks`, `syft` or `cyclonedx` step. The available scanner data in `target-metrics.json` is a heuristic regex pass, not a CVE audit.

### 8.3 Dependency risks

- **No known CVE was verified** in this static review; a real `pip-audit`/`npm audit` run is required before a pilot.
- The full `requirements.txt` includes WebRTC and OpenSSL-related packages that are not needed by the production mobile API. They increase the audit surface for anyone who installs the full requirements.
- `pypdf` parses untrusted PDFs; the code mitigates this with a subprocess, `RLIMIT_CPU`, `RLIMIT_AS`, a 100-page cap and a 20-page extraction cap (`app/guidance_search.py:111-153, 280-295`). This is good, but the isolation is Unix-specific.
- `psycopg` and `redis` are direct dependencies for v3; if they are missing or down, guidance fails closed with 503 rather than falling back to memory (`app/guidance_storage.py:119-135, 295-307`; `app/guidance.py:108-115`). This is the correct failure mode.

### 8.4 Recommendation

Adopt a hash-locked lockfile, pin the Docker image digest, add a CI job that runs `pip-audit`, `npm audit`, `osv-scanner`, secret scanning and an SBOM step, and enable automated dependency updates. The model-download SHA-256 verification should be extended to a signed manifest or at least recorded in the release artifact.

---

## 9. Testing and Quality Assurance

### 9.1 What the suites cover well

The tests are unusually thorough for a pilot:

- **Auth and admission:** missing, malformed, revoked and oversized tokens; 413 before multipart parsing; one active request per token; two-global capacity; no queue; 429 and `Retry-After` (`tests/test_mobile_api.py:144-220, 291-319`).
- **Privacy:** logs contain fixed error codes, not media, transcripts, tokens or turn IDs (`tests/test_mobile_api.py:394-417`; `tests/test_mobile_api.py:427-442`).
- **Input validation:** MIME aliases for Android, invalid audio, oversized files, invalid turn IDs, malformed multipart, context shape and exact UTF-8 boundary (`tests/test_mobile_api.py:81-124, 223-246, 534-575`).
- **SSRF and research:** private/invalid URLs, mixed public/private DNS, redirect revalidation, size caps, exact model matching, wrong official domain, encrypted PDF rejection (`tests/test_guidance_search.py:56-80, 123-149`).
- **Guidance safety:** goal confirmation, one action per step, evidence gating, sensitive actions, frame reuse, revision conflicts, idempotency, cancellation and server restart (`tests/test_guidance.py:91-160` and later cases).
- **Mobile:** settings and credential validation, controller generations, confirmation parsing, media cleanup, hardware key policy, accessibility labels, and screen behaviour (`mobile/tests/`).
- **Kotlin:** long press, repeat, chord, orphan, late event, debounce and touch/hover reset (`VolumeKeyPolicyTest.kt`, 15 tests).

### 9.2 What the suites do not prove

- **No real device:** the Jest tests mock native modules; the Python tests use TestClient and fake managers. `docs/IMPLEMENTATION_STATUS.md:24` explicitly says the web preview does not verify camera, microphone, SecureStore or TalkBack.
- **No real blind-user study:** the acceptance document requires 5 blind users across 6 tasks at 80 percent completion, and every row is `Chưa thử` (`docs/GUIDANCE_ACCEPTANCE_040.md:15`).
- **No real remote matrix:** the 10-remote fixtures in `tests/test_guidance.py` are synthetic and explicitly disclaimed (`docs/RELEASE_040.md:29`).
- **No real AI quality gate:** the release notes record intermittent Gemini service errors, a 60-second timeout on 3.8 Flash, and a switch to 3.1 Flash Lite for the demo. There is no automated evaluation set with human-scored accuracy.
- **No coverage threshold:** the test volume is high, but coverage is not measured, so untested branches (especially native lifecycle and real error paths) are invisible.
- **No CI:** tests run only when a developer invokes `scripts/check.sh` or the EAS preview gradle command.

### 9.3 Quality-gate assessment

| Gate | Status |
|---|---|
| Backend unit/integration tests | Strong, present, manually run |
| Mobile unit/component tests | Strong, present, manually run |
| Kotlin policy tests | Present, run in EAS preview gradle command |
| TypeScript strict check | Present, manually run |
| Python compile check | Present, manually run |
| Python lint/type check | Absent |
| Coverage measurement | Absent |
| Real-device test | Absent |
| Real-user test | Absent |
| CI enforcement | Absent |

**Verdict:** test design is a strength; test enforcement and field validation are the gap.

---

## 10. Security and Vulnerability Analysis

### 10.1 Threat model summary

The relevant assets are:

- The operator's paid Gemini API key.
- Blind users' photos, audio, transcripts and guidance sessions.
- The device manual knowledge base and its approval state.
- Trial tokens and the operator's server capacity.

The relevant adversaries are:

- An unauthenticated internet scanner or quota abuser.
- A holder of a leaked trial token.
- A malicious web page or PDF processed by the research pipeline.
- A prompt-injection attempt embedded in an image, document or transcript.
- A supply-chain attacker in the Python/npm/Docker ecosystem.
- A misconfigured operator exposing the admin UI or the legacy demo.

### 10.2 Findings overview

| ID | Severity | Status | Area | File |
|---|---|---|---|---|
| SEC-DEEPSEEK-001 | HIGH | verified | Licensing | `README.md` |
| SEC-DEEPSEEK-002 | HIGH | probable | Auth / availability | `app/main.py` |
| SEC-DEEPSEEK-003 | HIGH | verified | Licensing | `Dockerfile` |
| SEC-DEEPSEEK-004 | MEDIUM | verified | Network / secrets | `app/vision.py` |
| SEC-DEEPSEEK-005 | MEDIUM | verified | Availability / scaling | `app/mobile_security.py` |
| SEC-DEEPSEEK-006 | MEDIUM | verified | Credentials / lifecycle | `app/mobile_security.py` |
| SEC-DEEPSEEK-007 | LOW | verified | Supply chain | `requirements.txt` |
| SEC-DEEPSEEK-008 | LOW | probable | Network / admin | `app/guidance_admin.py` |

Full evidence, impact and remediation are in the YAML frontmatter. The narrative below adds context and cross-checks.

### 10.3 Strong controls that should be preserved

1. **Fail-closed token configuration.** `TrialTokens` accepts only 1 to 10 unique 64-character lowercase SHA-256 digests; malformed or empty configuration produces an empty tuple and readiness false (`app/mobile_security.py:19-35`). The middleware returns 503 rather than running open (`app/mobile_security.py:107-109`).
2. **Digest-only storage and constant-time comparison.** The raw token is never stored; `hashlib.sha256` produces a digest and `hmac.compare_digest` compares each configured digest (`app/mobile_security.py:37-46`). The test spies on `compare_digest` to assert that all digests are checked (`tests/test_mobile_api.py:167-180`).
3. **Pre-parse body caps.** The middleware rejects oversized `Content-Length`, validates the actual chunked body, and only then hands a replayable stream to FastAPI (`app/mobile_security.py:126-160`). Tests prove the multipart parser is never reached for unauthorized or oversized requests (`tests/test_mobile_api.py:144-155, 198-220`).
4. **Bounded file reads.** `read_upload` reads `maximum + 1` bytes and rejects anything above the cap, so a chunked upload cannot stream past the limit (`app/mobile_api.py:133-146`). Image decode and audio decode have separate caps (`app/mobile_pipeline.py:71-136`).
5. **Object-level ownership in v3.** The token digest becomes the owner identity; every task, operation and cancellation is loaded from that owner's document (`app/guidance_api.py:26-32`; `app/guidance.py:165-242, 330-377`). A task ID alone is not enough to read another user's operation.
6. **Idempotency and revision guards.** Requests are fingerprinted over transcript, frame ID, image hash, task ID and expected revision; duplicate frames are rejected; stale revisions get 409 (`app/guidance.py:161-205`). The client checks task and revision before accepting a result (`mobile/src/core/DeviceTaskController.ts:233-239`).
7. **SSRF-resistant research.** The fetcher resolves DNS once, rejects non-global answers, pins the IP while setting the original Host and SNI, requires HTTPS and official domains, and revalidates every redirect (`app/guidance_search.py:93-194`). The PDF worker is isolated with CPU and address-space limits (`app/guidance_search.py:280-295`).
8. **Prompt-injection containment.** The system prompts label transcripts, image text, web pages and JSON as untrusted; the orchestrator ignores model claims that are not supported by evidence; the client maps server error codes to fixed messages rather than echoing arbitrary text (`app/guidance_vision.py:16-51`; `app/guidance.py:540-551`; `mobile/src/services/guidanceApi.ts:41-52`).
9. **Payment, password and destructive-action stop.** The orchestrator recognises factory reset, data wipe, purchase and password entry and returns an explanation-only response before final confirmation (`app/guidance.py:533-535`). The system prompt also forbids reading or repeating passwords (`app/guidance_vision.py:47-48`).
10. **Non-root container and narrow Android permissions.** The runtime uses UID 10001 (`Dockerfile:16, 25`); Android blocks storage, video, overlay and backup permissions (`mobile/app.config.ts:11-31`).

### 10.4 Attack-surface analysis

| Surface | Exposure | Controls | Gaps |
|---|---|---|---|
| `/api/v2/analyze` | Public behind HTTPS and Bearer token | Token auth, body caps, MIME and image/audio validation, WorkGate | No per-token rate or spend cap; token lifecycle static |
| `/api/v2/transcribe` | Same | Same, separate 2 MiB cap | Same |
| `/api/v3/assist` | Same | Bearer auth, multipart caps, guidance availability, WorkGate | Same; no per-token rate cap |
| `/api/v3/tasks/{id}/observations` | Same | Bearer auth, owner isolation, revision check, frame dedup | Same |
| `/api/v3/operations/{id}` | Same | Bearer auth, owner isolation | Polling load not rate-limited per token |
| `/api/health` | Unauthenticated | Boolean readiness only | Reveals readiness state; acceptable |
| `/api/webrtc/offer` (legacy) | Local only by documentation | None | No auth, no rate limit, 15-second lock, Gemini key proxy |
| `/api/sessions/...` (legacy) | Local only by documentation | Session UUID knowledge | No auth; active media and export readable if ID is known |
| Admin UI | Localhost only | Loopback address check, signed session cookie, CSRF, CSP | Address check fragile behind a local proxy/tunnel |
| Research fetch | Server-initiated | HTTPS, DNS pinning, official domains, byte/redirect caps, subprocess limits | Unix-only PDF isolation; no image/OCR in fetched docs |
| Supply chain | Build/deploy | Version pins, model SHA-256 manifest | No hashes, no CVE gate, tag-only base image |

### 10.5 Secrets and privacy

- The Gemini API key and Brave key are server-side only. The mobile app never contains them (`README.md:62`; `docs/MOBILE_ARCHITECTURE.md:51`).
- Trial tokens are stored in the device SecureStore and only their SHA-256 digests are on the server (`mobile/src/hooks/useSettings.ts:25-46`; `app/mobile_security.py:19-46`).
- `.env`, `pilot-token*.txt`, signing keystores and local database dumps are gitignored (`.gitignore:2, 20, 23-39`).
- Logs use fixed diagnostic codes and do not contain media, transcripts, tokens or upstream bodies; tests assert this (`app/mobile_api.py:185-191`; `tests/test_mobile_api.py:394-417`).
- The demo `health` endpoint exposes `model_error` and `vision_error`, which can include local configuration text. This is not a secret, but it is an information leak if the demo is exposed; it is folded into SEC-DEEPSEEK-002.

### 10.6 Residual risks worth naming

- **Model output is spoken.** The guidance success path speaks server-provided `speech` and `instruction` after shape validation, not after an allowlist check. TLS protects the channel, and the server is trusted, but a compromised server or MITM with a trusted certificate could speak arbitrary text. This is inherent to the product; it should be documented in the threat model.
- **No certificate pinning.** The mobile client relies on the Android system trust store; a user-installed CA can intercept traffic. For a pilot this is acceptable, but a production deployment should consider pinning or at least certificate transparency monitoring.
- **No per-token quota.** A valid tester token can serially drain Gemini quota; the only limits are concurrency and the operator's billing alerts.
- **No audit trail.** There is no per-token request log, no admin audit export and no SIEM integration.
- **The legacy demo is one mistake away.** The code is correct only if the operator follows the README warning.

### 10.7 Scanner triage

The five `target-metrics.json` secret flags are synthetic test fixtures. They should be allowlisted or generated, but they are not evidence of a leaked production credential. No live key, token or `.env` file was found in tracked files. This is a clean result for a project of this size, and it reflects the deliberate use of `.env.example`, SecureStore and digest-only server storage.

---

## 11. API and Interface Design

### 11.1 v2 endpoints

| Method | Path | Auth | Input | Output |
|---|---|---|---|---|
| GET | `/api/health` | None | None | Boolean readiness fields |
| POST | `/api/v2/analyze` | Bearer | Multipart: `image`, one of `audio` or `question`, `client_turn_id`, optional `context` | `client_turn_id`, `transcript`, `answer`, `image_feedback`, `latency_ms`, `timings` |
| POST | `/api/v2/transcribe` | Bearer | Multipart: `audio`, `client_turn_id` | `client_turn_id`, `transcript`, `latency_ms` |

Key limits: image JPEG max 2 MiB and 1280 px; audio max 2 MiB and 60 seconds decoded; question 1 to 1000 characters; context max 3 pairs and 4096 UTF-8 bytes; total request 4 MiB plus 64 KiB, or 2 MiB plus 64 KiB for transcription (`app/mobile_api.py:23-25, 133-146`; `docs/MOBILE_ARCHITECTURE.md:16-43`).

### 11.2 v3 endpoints

| Method | Path | Auth | Input | Output |
|---|---|---|---|---|
| POST | `/api/v3/assist` | Bearer | Multipart: `transcript`, `image`, `client_request_id`, `frame_id` | 202 with `task_id`, `operation_id` |
| POST | `/api/v3/tasks/{id}/observations` | Bearer | Same plus `expected_revision` | 202 with task and operation IDs |
| GET | `/api/v3/operations/{id}` | Bearer | Path ID | Operation status, result or fixed error |
| DELETE | `/api/v3/tasks/{id}` | Bearer | Path ID | Cancellation acknowledgement |
| DELETE | `/api/v3/tasks/current?client_request_id=...` | Bearer | Query ID | Cancellation tombstone for a lost upload |

The v3 contract is well designed for a mobile client on an unreliable network: asynchronous acceptance, idempotent request IDs, explicit revisions, owner isolation, and cancellation tombstones. The client polls up to 150 times at 800 ms intervals with a 120-second deadline and a 25-second per-request timeout (`mobile/src/core/DeviceTaskController.ts:228-264`; `mobile/src/services/guidanceApi.ts:62`).

### 11.3 Legacy demo endpoints

`app.main:app` exposes `/`, `/app.css`, `/app.js`, `/api/health`, `/api/webrtc/offer`, `DELETE /api/sessions/{id}`, `GET /api/sessions/{id}/turns/{turn_id}/image`, `POST .../analysis`, `GET .../audio` and `GET .../export`. These are intentionally unauthenticated and local-only. They should not be part of any public deployment; see SEC-DEEPSEEK-002.

### 11.4 Contract and documentation trade-offs

- Production disables OpenAPI, Swagger and ReDoc (`app/mobile_api.py:176`). This reduces attack surface and information disclosure, but it also means there is no machine-readable API contract for integrators. The docs are handwritten and detailed, but they can drift from code.
- The client performs strict response validation: expected turn ID, bounded transcript and answer, finite non-negative timings, and exact guidance phase/status enums (`mobile/src/services/api.ts:58-79`; `mobile/src/services/guidanceApi.ts:17-34`). This is stronger than relying on TypeScript types alone.
- Error codes are fixed strings mapped to user messages. This prevents upstream detail injection but makes it harder to evolve error semantics without a shared code registry.

---

## 12. Data Persistence and State

### 12.1 Redis task store

- Prefix: `matkinh:`; owner document key is `owner:` plus SHA-256 of the token digest (`app/guidance_storage.py:20, 354-355`).
- TTL: idle 600 seconds, hard 1800 seconds (`app/guidance_storage.py:18-19`; `app/guidance_contract.py:10-11`).
- Owner lock: Redis lock with a 5-second timeout and no blocking; a busy owner gets `owner_busy` rather than queuing (`app/guidance_storage.py:370-387`).
- Compare-and-set: a Lua script checks the revision before writing (`app/guidance_storage.py:342-346`).
- Restart handling: operations carry a worker boot ID; a pending operation from a previous boot is marked failed with `server_restarted` (`app/guidance.py:339-346`).
- No media: only task facts, operations, request fingerprints, tombstones and last results.

### 12.2 PostgreSQL knowledge repository

- Dedicated database `mat_kinh`; the repository refuses to start against another database name (`app/guidance_storage.py:124-135`; `scripts/migrate_guidance.py:17-20`).
- `guidance_profiles` stores immutable content versions with lineage, status, parent, sources, creator and timestamp; a trigger rejects content, version, parent or lineage updates (`migrations/001_guidance.sql:6-43`).
- `guidance_reviews` records approve, reject, suspend and edit actions with reviewer and note (`migrations/001_guidance.sql:22-29`).
- Advisory locks serialise version creation and approval by lineage, preventing obsolete-version fallback (`app/guidance_storage.py:178-235`).
- The GIN index on `profile` supports identity lookup (`migrations/001_guidance.sql:21`).

### 12.3 Failure modes

- Guidance storage unavailable: the service returns 503 with a fixed message and does not fall back to memory (`app/guidance.py:129-131, 247-250`; `app/guidance_storage.py:23-24`).
- A task that expires between submission and completion is marked failed, and the operation surface returns the appropriate error (`app/guidance.py:133-140, 313-328`).
- Client-side recovery stores the API URL, token and request ID in SecureStore so it can cancel a lost upload after a forced close (`mobile/src/services/deviceRecovery.ts:7-60`). It refuses to send a stored token to a different URL unless the token matches (`mobile/src/services/deviceRecovery.ts:46-51`).

### 12.4 Persistence weaknesses

- No backup/restore or retention policy is documented for PostgreSQL or Redis. The knowledge base is valuable and should have a backup plan.
- No migration runner state beyond `guidance_schema_migrations`; the migration script applies every `[0-9]*.sql` in order and relies on idempotent SQL. This is acceptable for one migration but will become fragile.
- No Redis/PostgreSQL services are included in Docker; operators must run them separately. This is a deployment gap, not a data-model flaw.
- The v2 path has no persistence at all, so a server restart loses active demo sessions; this is intentional and documented.

---

## 13. Performance and Concurrency

### 13.1 Concurrency model

- Uvicorn runs one worker in production (`Dockerfile:30`).
- CPU-bound ASR runs in a thread via `asyncio.to_thread`; the shared recognizer has a thread lock (`app/asr.py:74-92`; `app/mobile_pipeline.py:37-40`).
- Admission is a two-slot, no-queue `WorkGate`; one token can hold at most one lease (`app/mobile_security.py:76-88`).
- Cancellation sets a stop event and releases the slot only after the worker thread actually finishes (`app/mobile_security.py:49-73`; `app/mobile_pipeline.py:90-110`).
- v3 jobs run as asyncio tasks after a 202 response; polling and cancellation do not consume an AI slot (`app/guidance.py:252-302`; `docs/GUIDANCE_040.md:55`).

### 13.2 Bottlenecks

| Bottleneck | Evidence | Impact |
|---|---|---|
| Gemini latency | Release notes: 6.3 and 7.1 seconds for guidance; 8.1 seconds end-to-end for a synthetic v2 turn; 10.0 seconds smoke test | Dominates the user-perceived latency; the <10-second median target is not proven. |
| Zipformer model load | A smoke test records 1,737 ms load; Docker start period is 60 seconds | Cold start can exceed the target; health is not ready until load completes. |
| Single worker | `--workers 1` | Cannot use multi-core for requests; horizontal write scaling breaks admission. |
| Shared recognizer lock | One inference at a time | The two-slot gate can admit two requests but ASR serialises them. |
| Image resize on device | `ImageManipulator` tries quality 0.82, 0.65, 0.48 | Adds CPU and latency on low-end phones. |
| PDF subprocess | Up to 6 seconds and 512 MiB | Rare, but consumes a slot and can time out. |
| Polling | 800 ms interval, 150 polls | Up to 120 seconds; users may perceive a stall. |

### 13.3 Latency evidence

The docs are honest:

- A synthetic v2 smoke test on a Mac: 10,060 ms server time, ASR 59 ms, Gemini 10,001 ms (`docs/IMPLEMENTATION_STATUS.md:30-32`).
- A later synthetic HTTPS flow: 6,853 ms total, ASR 141 ms, Gemini 5,814 ms (`docs/IMPLEMENTATION_STATUS.md:38`).
- Another synthetic HTTPS flow: 8,087 ms total, ASR 175 ms, Gemini 7,504 ms (`docs/VOICE_CONTEXT_020.md:85`).
- The guidance flow: two recent turns took about 6.3 and 7.1 seconds at Gemini (`docs/RELEASE_040.md:27`).

The project targets a median under 10 seconds from send to speech start, but the docs correctly say the evidence is insufficient (`docs/MOBILE_ARCHITECTURE.md:39`; `docs/ANDROID_ACCEPTANCE.md:31-35`). The next step should be instrumented real-device measurement, not speculative optimisation.

### 13.4 Scalability assessment

The current design is intentionally single-instance. That is acceptable for a 10-token pilot if documented and enforced. It is not acceptable for a broader deployment. The two options are:

1. **Enforce single instance:** keep `--workers 1`, `--max-instances 1`, add a startup assertion that workers equals one, and document the capacity ceiling.
2. **Move admission to Redis:** a per-token lease key with TTL and a global semaphore key, both acquired atomically. This adds a dependency but preserves the invariants under horizontal scale.

The current code quietly assumes option 1 without enforcing it. SEC-DEEPSEEK-005 captures that risk.

---

## 14. Deployment and Operations

### 14.1 Container topology

The Dockerfile has two stages:

1. **model stage** — installs Hugging Face tooling, copies `model_config.json` and `download_model.py`, downloads the pinned model into `/opt/zipformer`, and removes the cache (`Dockerfile:1-8`).
2. **runtime stage** — installs `libgomp1`, creates non-root user 10001, copies `requirements-mobile.txt`, `app/`, `migrations/`, the migration script and the model, then runs one Uvicorn worker (`Dockerfile:10-30`).

The image contains the mobile API, the model, the migrations and the migration script; it does not contain the legacy web UI, the admin app, PostgreSQL, Redis or the mobile APK. This is the correct artifact role.

### 14.2 Container hardening scorecard

| Control | Status |
|---|---|
| Non-root user | Yes, UID 10001 |
| Read-only root filesystem | No |
| Dropped Linux capabilities | No explicit drop |
| No-new-privileges | Not set |
| Health check | Yes, `/api/health` |
| Pinned base image digest | No, tag only |
| Secrets in image | No; environment/secrets expected |
| Minimal runtime dependencies | Reasonably minimal |
| Model baked into image | Yes, which creates the licensing issue and a large image |
| Single worker enforced | Yes by command, but not asserted by code |

### 14.3 External services and deployment topology

```text
Android APK (EAS, com.apec.matkinh.pilot)
  -> HTTPS tunnel or reverse proxy
  -> app.mobile_api:app (Uvicorn, one worker, UID 10001)
       -> Zipformer on local CPU
       -> Gemini Interactions API (cloud)
       -> Redis (v3 task facts)
       -> PostgreSQL mat_kinh (knowledge profiles)
       -> Brave Search API (optional, disabled by default)
  -> device TTS / TalkBack

Admin browser on localhost:8081
  -> app.guidance_admin:app (loopback only)
  -> PostgreSQL mat_kinh
  -> official vendor documents (HTTPS, SSRF-controlled)
```

The docs use a Mac plus a temporary Cloudflare Quick Tunnel for the pilot and a Cloud Run reference for hosting (`docs/ANDROID_SETUP.md:71-88`). The Cloud Run command sets `--max-instances 1` and `--concurrency 10`, with the app gate still limiting AI jobs to two. That is coherent for a pilot, but it is not a production topology.

### 14.4 Operational gaps

- **No CI/CD:** no automated build, test or deploy pipeline. EAS builds are manual or triggered by the stale repack workflow.
- **No infrastructure as code:** no Docker Compose, Terraform, Kubernetes manifests or Cloud Run service definition in the repository.
- **No observability:** no metrics, traces, structured JSON logs, request IDs, alerting or dashboards. Logs use fixed codes but are not aggregated.
- **No backup/restore runbook:** PostgreSQL and Redis have no documented backup procedure.
- **No secret manager integration in the repository:** the docs describe Cloud Run secrets, but local operation uses `.env`.
- **No versioned release artifacts:** the only tag is mispointed; APK links are external and temporary.
- **No TLS termination in the image:** the operator must provide a reverse proxy or tunnel. This is normal, but it should be part of a deployment checklist.

### 14.5 Deployment verdict

The container is a reasonable pilot runtime: non-root, minimal, health-checked, model-pinned and single-worker. It is not a hardened production deployment. Before a broader pilot, add image digest pinning, read-only filesystem, dropped capabilities, a secret manager, a reverse-proxy/TLS checklist, backups and basic observability.

---

## 15. Documentation, Onboarding and Version Delta

### 15.1 Documentation strengths

- The repository has 15 Markdown documents, roughly 558 documentation lines, plus a detailed README.
- The docs cover architecture, API, Android setup, hardware controls, voice/context behaviour, release notes, acceptance checklists and implementation status.
- The acceptance tables are concrete: 10 remotes, TalkBack, 200 percent font, 20 turns on two phones, 5 blind users across 6 tasks, 80 percent completion (`docs/GUIDANCE_ACCEPTANCE_040.md:5-15`; `docs/ANDROID_ACCEPTANCE.md:7-29`).
- The docs are honest about failures: Gemini 503/timeout, ASR misrecognition, synthetic fixtures, and the lack of real-device validation.
- Privacy boundaries are explained in plain Vietnamese, including what is sent to Gemini and what is deleted.

This is better documentation than many production projects.

### 15.2 Front-door integrity issues

The root README still has several problems:

1. **Two products in one front door.** It begins with the Android app, but then presents a macOS Chrome WebRTC demo and a LiDAR sensor section. A new operator can easily run the wrong backend or assume the demo is the product (`README.md:1-31, 118-124`).
2. **The LiDAR claim is aspirational.** The README advertises the VL53L9CX sensor and says software has to analyse it, but there is no integration code. This is a hardware-reality mismatch (`README.md:118-124`).
3. **The private-repository claim is false.** The README says the repository is private, while `git ls-remote` shows it is public (`README.md:114-116`).
4. **The model default drifts from the deployed demo.** The source and `.env.example` default to `gemini-3.8-flash`, while the release notes say the demo was switched to `gemini-3.1-flash-lite` after 3.8 timed out (`README.md:20, 59`; `docs/RELEASE_040.md:21`).
5. **Temporary URLs are presented as setup instructions.** The release docs include several `trycloudflare.com` URLs that are inherently short-lived (`docs/RELEASE_040.md:9-13`; `docs/RELEASE_010` equivalents in `docs/RELEASE_021.md:6`). Operators must replace them manually.
6. **An author note admits confusion.** The README says the author is not sure why a Gemini token is needed or what v0.2.1 through v0.4 did (`README.md:128`). This is disarming honesty, but it undermines confidence in the version narrative.
7. **No English architecture overview.** The Vietnamese docs are appropriate for the audience, but they limit external review and contributor onboarding.
8. **The only tag is mispointed.** `v0.1.0` points at the 0.4 implementation commit, so the release history cannot be reconstructed from tags.

### 15.3 Version milestone delta

The docs describe the following evolution:

| Version | Functional delta | Evidence |
|---|---|---|
| 0.1.0 | Initial Android pilot: camera, voice question, server STT, Gemini answer. | `docs/IMPLEMENTATION_STATUS.md:40-42` |
| 0.1.1 | Android 15 permission/background lifecycle fixes; camera recreation on resume. | `docs/ANDROID15_FIX.md:5-13` |
| 0.1.2 | Upload fix: use `expo/fetch` and `expo-file-system` `File` for multipart. | `docs/UPLOAD_FIX_012.md:1-14` |
| 0.1.3 | Specific input error messages; MIME aliases for Android M4A; Gemini error classification. | `docs/INPUT_FIX_013.md:5-16, 31-37` |
| 0.2.0 | Optional question confirmation, 8-second command window, follow-up context, structured Gemini output. | `docs/VOICE_CONTEXT_020.md:3-21` |
| 0.2.1 | Longer command phrases and parser hardening. | `docs/IMPLEMENTATION_STATUS.md:57-59` |
| 0.3.0 | Native volume-key module, MainActivity plugin, policy tests, expanded voice menu. | `docs/RELEASE_030.md:1-23` |
| 0.4.0 | v3 device guidance: stateful remote guidance, evidence gating, Redis/PostgreSQL, admin review, optional research. | `docs/RELEASE_040.md:1-33` |

The deltas are documented, but the code history does not support them: five commits, one mispointed tag, and release archives kept outside Git (`docs/RELEASE_040.md:31`). A reviewer cannot verify that the 0.2.0 behaviour described in the docs corresponds to a specific commit.

### 15.4 Onboarding friction

A new operator needs:

- Python 3.11 virtualenv and the full requirements (or the mobile subset for the API).
- A Hugging Face model download and a Gemini API key.
- A trial token generated by a script and a SecureStore-compatible device.
- For v3: PostgreSQL, Redis, migrations, an admin token, and optionally a Brave API key plus storage-rights confirmation.
- For Android: Node 22.13, Expo/EAS account, Android signing key, and a native build.
- For real-device testing: an HTTPS tunnel or reverse proxy and a phone on the same network path.

That is a lot of setup for a first run. The docs are detailed, but there is no single `docker compose up` or one-command local stack. This is an onboarding friction score of roughly **6/10**: clear for an experienced operator, slow for a new contributor.

---

## 16. Licensing and Legal Compliance

### 16.1 Repository licence

There is no root LICENSE. A public repository without a licence grants no rights under default copyright. The README's claim that the repository is private is false, and it does not cure the absence of a grant. This affects every partner, pilot site, contributor and forker.

### 16.2 Third-party components

| Component | Licence | Obligation / risk |
|---|---|---|
| sherpa-onnx runtime | Apache-2.0 | Retain licence and NOTICE; the repository does not include a NOTICE. |
| `hynt/Zipformer-30M-RNNT-Streaming-6000h` weights | CC BY-NC-ND 4.0 per README | Non-commercial only; no derivatives; attribution required. Baked into the Docker image at build time. |
| Gemini Interactions API | Google API terms | Server-side key; usage subject to Google terms and quota. |
| Brave Search API | Brave terms | Opt-in; storage-rights confirmation required. |
| Geist font | Distributed via `@expo-google-fonts/geist`; licence not documented in-repo | Verify OFL or equivalent and include attribution if required. |
| `cue.wav` | No provenance or licence note | Verify ownership; a UI cue may be third-party. |
| `docs/VL53L9CX_ToF.jpg`, screenshots | No explicit licence note | Trademark/copyright review; the image appears to be vendor marketing material. |

### 16.3 Commercial feasibility verdict

**Blocked.** The NC term forbids commercial use, and the ND term forbids distributing the quantised or fine-tuned weights that latency work would likely produce. Even if the project adds an Apache-2.0 repository licence, it cannot relicense the weights. A commercial path requires either:

- a permissive or commercially licensed Vietnamese ASR model, or
- a separate commercial licence from the weights author, or
- a clear non-commercial pilot boundary with legal review.

### 16.4 Recommendation

1. Add an Apache-2.0 LICENSE and a NOTICE covering sherpa-onnx and other third-party components.
2. Correct the README's private-repository claim.
3. Record the licence of every binary asset and model weight in a `THIRD_PARTY_NOTICES.md`.
4. Keep CC BY-NC-ND weights out of the distributable image, or obtain a commercial licence.
5. Obtain legal review before any funded, paid or public deployment.

---

## 17. Prioritised 30/60/90-Day Roadmap

### 30 days — remove legal and exposure risk

1. **Add LICENSE and NOTICE.** Use Apache-2.0 for the repository and include sherpa-onnx attribution; correct the README private claim.
2. **Separate or secure the legacy demo.** Remove `app.main:app` and `web/` from the deployable surface, or add Bearer auth, loopback binding, rate limiting and a body cap. Remove demo-only packages from the production requirements.
3. **Stop baking CC BY-NC-ND weights into the image.** Download or mount them at runtime under an explicit licence acceptance, and document the commercial restriction.
4. **Fix Gemini egress.** Set `trust_env=False` in `app/vision.py`; add a regression test with proxy environment variables.
5. **Add basic CI.** Run `pytest`, `npm test`, `tsc --noEmit`, `compileall`, `node --check`, `ruff`, `mypy` (or pyright) and `npm audit`/`pip-audit`. Fail the build on high-severity findings.
6. **Fix release metadata.** Re-tag the actual 0.4.0 commit, add tags for 0.1.0 through 0.4.0 or document that they are not reconstructable, and correct the stale `repack-android.yml` (it still names 0.2.1 and a 0.2.0 build ID).
7. **Correct the front door.** Remove or clearly label the LiDAR section; state the actual Android product; reconcile the `gemini-3.8-flash` default with the documented `gemini-3.1-flash-lite` demo setting; remove stale tunnel URLs from setup instructions.

### 60 days — prove the product with real users

8. **Execute the real-device acceptance checklist.** At minimum: two Android phones, TalkBack, 200 percent font, 10 physical remotes, 20 consecutive turns over Wi-Fi and 4G, network loss, Redis/PostgreSQL loss, restart, cancellation under load, and volume-key behaviour.
9. **Run a supervised blind-user study.** Five users, six tasks, target 80 percent completion without button-by-button help. Record task success, time, error type and safety incidents.
10. **Measure latency on device.** Instrument upload, ASR, research, Gemini and TTS separately; report median and cold-start numbers. Do not optimise before the measurement.
11. **Add a real evaluation set.** At least 20 scenes with 2 to 3 questions each, including labels, obstacles, unclear images, follow-ups and remote guidance; human-score accuracy and hallucination.
12. **Add per-token expiry and quota.** Store token metadata, support revocation without restart, and enforce a per-token request/spend budget.
13. **Add dependency hashes, image digests and an SBOM.** Pin the base image by digest; add `pip-audit`, `npm audit` and `osv-scanner`; generate CycloneDX or Syft output.
14. **Add a deployment checklist and a backup runbook.** Cover TLS/reverse proxy, secrets, Redis/PostgreSQL backups, admin port isolation and single-instance enforcement.

### 90 days — make it operable and scalable

15. **Move admission to Redis or enforce single-instance.** Implement a shared per-token lease and global semaphore, or add a startup assertion and a clear capacity ceiling. Test two app instances against one gate.
16. **Add observability.** Structured logs with request IDs and token IDs (never tokens), metrics for latency/error/quota, a health dashboard and alerts for 5xx, 429 and Gemini quota.
17. **Add production identity.** Replace static bearer tokens with expiring, revocable credentials; consider OAuth device flow or mTLS for partner deployments. Keep the pilot token path as a fallback only.
18. **Harden the container.** Read-only root filesystem, dropped capabilities, no-new-privileges, digest-pinned base image, and a secret manager.
19. **Resolve the client architecture.** Remove the dead v2 controller or put it behind an explicit feature flag; extract camera/media lifecycle from `HomeScreen`; add ESLint and a coverage threshold.
20. **Plan the commercial path.** Select a permissively licensed ASR model or obtain a commercial licence; complete legal review; define a support and incident-response process for blind users.

### Success metrics for the next gate

| Metric | Target |
|---|---|
| Real-device checklist | 100 percent of rows completed with evidence |
| Blind-user task completion | At least 80 percent without button-by-button help |
| Median send-to-speech latency | Under 10 seconds on the pilot network |
| Unsafe instruction escapes | Zero in the synthetic and field safety suites |
| High-severity security findings | Zero open |
| Licence clarity | LICENSE, NOTICE and weight-licence decision recorded |
| CI | Green on every pull request |
| Real-device crash-free sessions | At least 99 percent over 20 turns on two phones |

---

## 18. Methodology, Evidence and Limitations

### 18.1 What was inspected

- `target-metrics.json` for deterministic file, line, language and test counts.
- All backend modules under `app/`.
- The Android client under `mobile/src/`, the Kotlin module, Expo configuration, EAS profile and workflow.
- The Python and mobile test suites, sampled in depth for auth, pipeline, SSRF, guidance and hardware-policy coverage.
- All 15 docs under `docs/`, the root README, `Dockerfile`, `requirements*.txt`, `pyproject.toml`, `model_config.json`, `migrations/001_guidance.sql`, and the scripts.
- Git metadata: commit count, authors, branches, tags and remote visibility.
- A repository-wide search for LiDAR, BLE, model versions, CI workflows and worker configuration.

### 18.2 What was not done

- No target files were modified.
- No real Android device, blind user, Gemini call, PostgreSQL instance, Redis instance or Brave call was exercised.
- No dynamic exploit was attempted against a running server.
- No `pip-audit`, `npm audit`, `osv-scanner`, `semgrep`, `bandit` or coverage run was performed; the dependency findings are configuration and process findings, not a CVE ledger.
- No attempt was made to execute the report through an external model; this is the DeepSeek-V4.1-Flash-1017 review.

### 18.3 Evidence conventions

All paths are repository-relative. Line numbers refer to the target commit. Where a finding depends on deployment context (legacy demo exposure, admin proxy, scaling), the status is `probable` rather than `verified`, and the recommendation states the condition. Deterministic counts come from `target-metrics.json`; narrative observations come from the code and docs cited inline.

### 18.4 Limitations of the scores

The scores are a judgement about the target as a pilot, not a certification. Architecture and code-quality scores reward the strong modular boundaries, validation and accessibility work. Security rewards the fail-closed controls but penalises the legacy demo, static token lifecycle, proxy-egress inconsistency, process-local admission and licensing risk. Documentation rewards the extensive Vietnamese docs but penalises the misleading front door, stale release metadata and missing licence. The overall score is deliberately below the simple average of architecture, code quality, security and documentation because the project is safety-critical and has no real-user validation.

---

## 19. Conclusion

Mắt Kính is a serious, thoughtful assistive engineering project. Its best ideas are the ones that matter most for a blind user: fail-closed authentication, bounded media, no audio to the cloud, evidence-gated guidance, explicit unsafe-instruction rejection, and an accessibility layer that respects TalkBack and hardware keys. Those are not cosmetic features; they are the right primitives.

The project is held back by release engineering and field validation, not by a lack of engineering skill. The three highest-leverage moves are:

1. **Make the legal and exposure boundary explicit:** add a LICENSE, stop shipping CC BY-NC-ND weights in the image, and remove or secure the legacy demo.
2. **Prove it with real users and real devices:** complete the acceptance checklist and run a supervised blind-user study before claiming readiness.
3. **Make the safety invariants mechanical:** add CI, static analysis, dependency hashes, per-token quotas, shared admission if scaling, and correct release tags.

If those three moves are executed, the project can credibly move from a well-engineered prototype to a supervised pilot that a partner can trust. Until then, the correct description is **promising, privacy-conscious, but unvalidated**.
