---
model: "Qwen3.8-Max"
model_id: "qwen3-8-max"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-30"
scores:
  overall: 7.8
  architecture: 8.3
  code_quality: 7.5
  security: 8.2
  documentation: 6.3
summary: "A privacy-conscious, unusually well-threat-modelled assistive system for blind Vietnamese users: a hardened FastAPI backend pairs local Zipformer STT with Gemini vision behind fail-closed SHA-256 trial tokens, a two-slot admission gate, and an Expo/React Native client whose pure TypeScript core enforces HTTPS-only transport and refuses to speak any server string outside a fixed allowlist. The engineering quality of the controls is well above pilot-grade, but the project has zero release engineering around them (no CI, no linter or type-checker config, no Python lockfile), no LICENSE in a repository that is verifiably public, no real-user validation of any kind, and a front-door README that documents a desktop demo and an unintegrated LiDAR sensor instead of the shipped Android product."
key_strengths:
  - "Mature, layered threat model: the manual-research fetcher resolves DNS once, requires every answer to be a global address, pins the returned IP while preserving SNI and TLS hostname verification, allowlists official vendor domains, caps redirects and bytes, and isolates PDF parsing in a subprocess under RLIMIT_CPU and RLIMIT_AS (app/guidance_search.py:93-194, 280-295)"
  - "Prompt-injection defence in depth plus a client-side speech firewall: system instructions classify the user transcript, OCR text, fetched web pages and all JSON fields as untrusted data rather than rules (app/vision.py:33-34, 47-50; app/guidance_vision.py:16-19), every Gemini call sets store=false, and the app will only speak a server-supplied string that matches one of 22 allowlisted messages so a compromised proxy cannot inject speech into a blind user's ear (mobile/src/services/api.ts:18-51, mobile/src/services/guidanceApi.ts:41)"
  - "Deterministic safety gates over AI output for a safety-critical user: instructions containing centimetre measurements, multi-press counts, compound actions, or a press verb during a locate step are rejected outright (app/guidance.py:587-592); factory reset, data wipe, purchases and password entry stop before final confirmation (app/guidance.py:533-535); and a photo of the remote is never accepted as proof that the TV or air conditioner changed state (app/guidance.py:540-551)"
  - "Fail-closed authentication and admission control: malformed or oversized token configuration is discarded rather than defaulting open (app/mobile_security.py:22-27), comparison uses hmac.compare_digest, tokens are 256-bit CSPRNG values of which only the SHA-256 digest is retained (scripts/create_trial_token.py:38-50), and request size is enforced before the multipart parser ever runs (app/mobile_security.py:126-138)"
  - "Verified accessibility rather than decorative labels: accessible names and roles are centralised in shared primitives used by every control (ActionButton, ToggleRow, ChoiceOption, AppText, StatusNotice), touch targets are 56-88 dp, TTS is routed through AccessibilityInfo.announceForAccessibility when TalkBack is active to avoid double speech (mobile/src/services/speech.ts:13-15), the camera preview is excluded from the accessibility tree (mobile/src/screens/HomeScreen.tsx:380), and the Kotlin module resets its key policy on touch or hover so TalkBack exploration always wins (HardwareControlsDispatcher.kt:85-98)"
  - "Privacy discipline that is asserted by tests, not just claimed: app/ contains only five log statements and none carries media, transcripts, tokens or upstream bodies (app/mobile_api.py:189-190); audio is deleted immediately after transcription (mobile/src/core/TurnController.ts:255-256); captures request exif:false; and the suite explicitly asserts that secrets, DSNs and upstream error bodies never reach user-facing strings (tests/test_guidance.py:298-303, tests/test_evaluate_mobile.py:55)"
key_weaknesses:
  - "Zero release engineering around strong code: no CI workflow exists anywhere in the target, pyproject.toml has no [tool.*] sections so ruff, black, mypy and pytest are all unconfigured, and there is no Python lockfile or dependency hashing, meaning none of the project's careful invariants are mechanically enforced and the container image is not bit-reproducible"
  - "No LICENSE file in a repository that is verifiably public, with README.md:116 justifying the omission by asserting it is private; combined with CC BY-NC-ND 4.0 Zipformer weights baked into the Docker image at build time (Dockerfile:7), this blocks the pilot adoption, contribution and commercial use the project exists to enable"
  - "The product has never met a real user: every row of docs/GUIDANCE_ACCEPTANCE_040.md (10 physical remotes, TalkBack, 200 percent font, 20 turns on two phones, 5 blind users across 6 tasks at 80 percent completion) is marked Chưa thử, and the docs themselves disclaim the 10-remote test fixtures as synthetic data rather than evidence of device support"
  - "The voice-command vocabulary is six exact-match phrases (app/guidance_contract.py:53-64), so one ASR error returns the identical prompt with no I-did-not-catch-you feedback - a dead end the team already observed when 'Bắt đầu hướng dẫn' was transcribed as 'BÁC ĐẦU HƯỚNG DẪN' (docs/RELEASE_040.md:27)"
  - "Two parallel client state machines are maintained but only one executes: HomeScreen.tsx:75 hardcodes deviceGuidance:true, leaving the 545-line TurnController and its confirmation and action-menu UI branches (HomeScreen.tsx:329-347) unreachable in production, with confirmQuestion, listenConfirmation and openActionMenu stubbed to no-ops (DeviceTaskController.ts:366-371)"
  - "The front door misleads: README.md leads with a macOS Chrome WebRTC demo that is not the product, advertises a VL53L9CX LiDAR sensor for which there is zero integration code in any language, directs operators to gemini-3.8-flash which the team's own log says timed out at 60 seconds and was replaced by gemini-3.1-flash-lite (docs/RELEASE_040.md:21), and carries a second author's public note that they do not know why a Gemini token is needed or what v0.2.1 did (README.md:128)"
  - "Capacity and history are both hard-capped: a single in-process two-slot gate shared by the v2 and v3 APIs under --workers 1 limits the pilot to two concurrent users and cannot scale horizontally, and git holds only two content commits, so the documented 0.1.x through 0.3.0 history is neither reconstructable nor reviewable"
security_findings:
  - id: "SEC-QWEN-001"
    severity: "HIGH"
    status: "verified"
    confidence: 0.97
    category: "licensing"
    title: "Public repository ships no LICENSE while README asserts it is private"
    file: "README.md"
    line_start: 114
    line_end: 116
    affected_function: "License of this repository"
    description: "The target tracks no LICENSE, COPYING or NOTICE file, yet the remote is publicly readable: an unauthenticated git ls-remote against origin returned refs/heads/main, refs/heads/ToF and refs/heads/ver1. The README justifies the omission by claiming the repository is private, and the release docs simultaneously publish a public GitHub source-archive link and a public APK download. Under default copyright, a public repository with no licence grants third parties nothing."
    evidence: "README.md:116 - It is still missing, follow the guidance above from other repositories. Currently a private repository, so of no concern. Contradicted by docs/RELEASE_040.md:31 (GitHub archive link) and docs/RELEASE_040.md:3 (public APK artifact)."
    impact: "APEC partners, pilot sites, reviewers, contributors and forkers have no legal grant to use, modify or redistribute any of the 13,282 lines of code. The Apache-2.0 sherpa-onnx runtime also requires licence and NOTICE retention that the repository does not provide."
    recommendation: "Add a LICENSE file (Apache-2.0 is the natural fit given the sherpa-onnx runtime) plus a NOTICE covering third-party components, correct the README claim, and record an explicit written decision about the CC BY-NC-ND model weights."
  - id: "SEC-QWEN-002"
    severity: "HIGH"
    status: "verified"
    confidence: 0.95
    category: "licensing"
    title: "CC BY-NC-ND 4.0 Zipformer weights are baked into the distributable container image"
    file: "Dockerfile"
    line_start: 7
    line_end: 8
    affected_function: "model build stage"
    description: "The first build stage downloads the Hugging Face weights into /opt/zipformer and the runtime stage copies them in, so every built image redistributes CC BY-NC-ND 4.0 licensed weights inside a new artifact. ND forbids distributing derived or repackaged versions, which also rules out the quantisation or fine-tuning needed to reach the project's own latency target, and NC forbids commercial use."
    evidence: "Dockerfile:7 RUN python scripts/download_model.py --model-dir /opt/zipformer; model_config.json repo_id hynt/Zipformer-30M-RNNT-Streaming-6000h; README.md:109 states the weights licence is CC BY-NC-ND 4.0 and README.md:112 warns not to relicense them."
    impact: "Pushing this image to any registry, or deploying it for a funded or paid pilot, is a licence violation. It also forecloses model optimisation, since a quantised or fine-tuned derivative cannot be distributed."
    recommendation: "Keep weights out of the image: mount a volume or download on first boot under the operator's own licence acceptance, and evaluate an Apache-2.0 or MIT licensed Vietnamese streaming ASR model for any production path."
  - id: "SEC-QWEN-003"
    severity: "HIGH"
    status: "probable"
    confidence: 0.85
    category: "auth"
    title: "Legacy demo application is fully unauthenticated and proxies the operator's paid Gemini key"
    file: "app/main.py"
    line_start: 65
    line_end: 121
    affected_function: "create_offer"
    description: "app.main:app exposes WebRTC signalling, image and audio retrieval, ZIP export and Gemini-backed analysis with no authentication, no rate limiting and a single global session. The only control preventing internet exposure is one sentence in the README, while the same codebase already demonstrates the correct control in the admin app, which enforces loopback host and client addresses in middleware."
    evidence: "app/main.py:65 declares the offer endpoint with no auth dependency; app/main.py:152-183 calls vision.analyze using the server-side GEMINI_API_KEY; app/main.py:194-203 returns a ZIP of the user's photo, audio and transcript. README.md:16 only says not to put app.main:app on the Internet. Contrast app/guidance_admin.py:75-83 which enforces loopback programmatically."
    impact: "If bound to a non-loopback interface or tunnelled the way the mobile API already is, any stranger can burn the operator's Gemini quota, read the active session's photo, audio and export bundle, and exhaust CPU through unthrottled offers that each run a 15-second ICE-gathering loop."
    recommendation: "Apply the guidance_admin loopback middleware to app.main, or require a bearer token, and refuse to bind a non-loopback host unless an explicit opt-in environment variable is set."
  - id: "SEC-QWEN-004"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.85
    category: "availability"
    title: "Admission lease has no timeout, so a wedged ONNX call permanently consumes global capacity"
    file: "app/mobile_security.py"
    line_start: 49
    line_end: 92
    affected_function: "WorkLease.release"
    description: "A lease is released only by the bound worker's done-callback, and there is no deadline, TTL or reaper. Decoding runs in asyncio.to_thread under a process-wide threading.Lock and cannot be preempted; the cooperative stop flag is only checked between decoded frames. Deferred cancellation is deliberate and tested, but no test covers a worker that never returns."
    evidence: "app/mobile_security.py:68-73 release() sets stop and defers gate release to _worker_finished; app/asr.py:76 and app/asr.py:83 hold _inference_lock across decoding; app/mobile_pipeline.py:92 and :101 poll lease.stop only between frames; tests/test_mobile_api.py:337 and tests/test_mobile_pipeline.py:153 assert the slot is held until the CPU work finishes."
    impact: "One wedged decode removes half of the two global slots permanently; two wedges are a total outage with no self-healing short of restarting the single uvicorn worker. For a mobility aid, a silent permanent 429 is a safety-relevant failure."
    recommendation: "Add a lease deadline (for example 90 seconds) with a background reaper that force-releases and logs the event, and expose current slot occupancy through the authenticated health payload."
  - id: "SEC-QWEN-005"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.9
    category: "availability"
    title: "One in-process two-slot gate is shared by the v2 and v3 APIs and cannot scale horizontally"
    file: "app/mobile_api.py"
    line_start: 163
    line_end: 183
    affected_function: "create_app"
    description: "WorkGate is a plain dictionary on the event loop, instantiated once and handed to both the mobile admission middleware and the guidance service. Guidance operations are long-lived (a Gemini call, optionally a Brave search and up to three document fetches) and compete for the same two slots as photo-question requests. Because the gate is process-local, adding a worker or a replica silently multiplies real capacity and breaks the per-token guarantee."
    evidence: "app/mobile_api.py:163 gate = WorkGate(capacity=2); app/mobile_api.py:179 install_guidance(application, tokens, gate, ...); app/guidance.py:214 lease = self.gate.acquire(owner); Dockerfile:30 runs --workers 1 with the comment that one process keeps the two-slot and per-token limits global."
    impact: "A single user running device guidance can starve every other user's analyze and transcribe request with 429 server_busy. The documented pilot ceiling is two concurrent users, and horizontal scaling requires re-implementing admission in Redis first."
    recommendation: "Move admission to a Redis-backed semaphore (Redis is already a hard runtime dependency), give guidance and v2 separate pools so a long guidance operation cannot block a quick question, and document per-instance capacity."
  - id: "SEC-QWEN-006"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.9
    category: "network"
    title: "Model weights are trusted on first use; no expected digests are committed"
    file: "scripts/download_model.py"
    line_start: 39
    line_end: 74
    affected_function: "main"
    description: "The pinned revision is validated as a 40-character hex SHA, but no expected content hash ships in the repository. The digest is computed after download and written to a local manifest, which is then treated as authoritative on subsequent runs. The Docker build performs that first, unverified fetch on the build host."
    evidence: "scripts/download_model.py:57 computes sha256 of the downloaded file; :64 records it in manifest.json; :39-42 reuses the recorded value as the expected digest only on later runs; Dockerfile:7 executes the download at image build time."
    impact: "A compromised mirror, a man-in-the-middle on the build host, or a rewritten upstream revision yields weights that are then recorded as trusted and baked into every image. With no CI, nothing would ever detect it, and the model directly shapes what blind users are told about their surroundings."
    recommendation: "Commit the expected SHA-256 of all four model files in model_config.json and fail the download on mismatch, so integrity does not depend on the machine that happened to fetch first."
  - id: "SEC-QWEN-007"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.85
    category: "network"
    title: "Pilot traffic is routed through ephemeral Cloudflare quick tunnels to a personal Mac"
    file: "docs/RELEASE_040.md"
    line_start: 10
    line_end: 13
    affected_function: "Bắt đầu demo"
    description: "The publicly distributed APK is instructed to point at a trycloudflare hostname that terminates on a developer laptop running uvicorn, PostgreSQL and Redis, with only port 8080 forwarded. Quick tunnels have no stable identity, no edge authentication and rotate on every restart; four different tunnel URLs appear across the release documentation."
    evidence: "docs/RELEASE_040.md:10 publishes the tunnel URL and :3 the public APK; docs/GUIDANCE_040.md:45 states the tunnel forwards only 8080; further URLs appear at docs/RELEASE_021.md:3, docs/RELEASE_030.md:3 and docs/INPUT_FIX_013.md:41; docs/IMPLEMENTATION_STATUS.md:42 confirms no independent hosting exists."
    impact: "Confidentiality and availability of blind users' photos, voice and transcripts depend on one laptop staying awake and one tunnel staying alive. A stale URL baked into a distributed APK silently breaks the pilot, and there is no edge rate limiting or WAF in front of the token-only authentication layer."
    recommendation: "Deploy the existing container to a real host using the Cloud Run recipe already written in docs/ANDROID_SETUP.md:72-88, front it with a stable authenticated domain, and stop publishing tunnel URLs in release notes."
  - id: "SEC-QWEN-008"
    severity: "MEDIUM"
    status: "probable"
    confidence: 0.8
    category: "config"
    title: "Upload cleanup depends on a private Starlette attribute inside a finally block"
    file: "app/mobile_api.py"
    line_start: 73
    line_end: 76
    affected_function: "bounded_form"
    description: "Both multipart helpers reach into an undocumented Starlette internal to close partially spooled uploads, and the admin app assigns another private attribute to inject a buffered body. Starlette is pinned to 0.48.0 but there is no lockfile hash and no CI job, so nothing guards the pin. Because the access sits in a finally block, a rename converts every failed upload into an AttributeError that masks the original exception."
    evidence: "app/mobile_api.py:75 iterates parser._files_to_close_on_error; app/guidance_api.py:85 repeats the same pattern; app/guidance_admin.py:97 assigns request._body. tests/test_mobile_api.py:249 and :264 cover the cleanup path against the currently pinned version."
    impact: "A routine dependency bump breaks the security-relevant file-descriptor and temp-file cleanup path at runtime, potentially leaking spooled user photos and audio to disk, and the failure would only surface after upgrade."
    recommendation: "Use getattr with an empty default, or track uploaded files explicitly, and add a CI job that runs the pinned suite on every dependency change."
  - id: "SEC-QWEN-009"
    severity: "LOW"
    status: "verified"
    confidence: 0.95
    category: "config"
    title: "Guidance startup swallows every exception without logging"
    file: "app/guidance.py"
    line_start: 108
    line_end: 115
    affected_function: "GuidanceService.start"
    description: "Redis, PostgreSQL and Gemini-key failures all collapse into the same silent ready=False. The entire app package contains only five log statements and none of them is in this path, so the server records no reason for the outage."
    evidence: "app/guidance.py:113-115 catches Exception and sets self.ready = False with the comment that guidance can be unavailable without taking the legacy v2 service down. Compare app/asr.py:62 which does call log.exception on model-load failure."
    impact: "An operator sees guidance_ready:false in the health payload with no server-side clue which of three dependencies failed, lengthening diagnosis on a laptop-hosted pilot where the operator is also the developer."
    recommendation: "Call log.exception with the failing dependency name (never the DSN or key) and surface a coarse reason code in the authenticated health response."
  - id: "SEC-QWEN-010"
    severity: "LOW"
    status: "verified"
    confidence: 0.9
    category: "auth"
    title: "Admin login has no throttling and all review actions are attributed to one literal identity"
    file: "app/guidance_admin.py"
    line_start: 121
    line_end: 129
    affected_function: "do_login"
    description: "The single shared admin token can be guessed without limit; there is no attempt counter, backoff or lockout. Every edit, approval and suspension is then recorded against the constant string local-admin, so the audit trail cannot identify who approved knowledge that will be spoken aloud to blind users. Mitigations are real but orthogonal: loopback host and client checks, a 24-character minimum secret, origin validation and HMAC-signed two-hour cookies."
    evidence: "app/guidance_admin.py:125 compares the secret with no attempt accounting; :175, :212 and :221 all pass the literal reviewer string local-admin; mitigations at :75-89 and :39-48."
    impact: "Any local process, or a malicious page loaded in a browser on the same machine, can attempt unlimited token guesses, and approved device-guidance profiles carry no accountable approver identity."
    recommendation: "Add a per-cookie and per-client attempt counter with exponential backoff, and replace the literal reviewer with an authenticated operator name so guidance_reviews is a genuine audit log."
  - id: "SEC-QWEN-011"
    severity: "LOW"
    status: "verified"
    confidence: 0.9
    category: "config"
    title: "Unauthenticated health endpoint discloses internal subsystem readiness"
    file: "app/mobile_api.py"
    line_start: 193
    line_end: 202
    affected_function: "health"
    description: "The admission middleware guards only POST to the two v2 paths, so the health route answers unauthenticated callers with a per-subsystem breakdown of what is configured and what is down, with no rate limit."
    evidence: "app/mobile_security.py:16 MOBILE_PATHS contains only /api/v2/analyze and /api/v2/transcribe; app/mobile_api.py:197-199 returns asr_ready, vision_ready, auth_ready, guidance_ready and research_ready."
    impact: "An unauthenticated observer can fingerprint the deployment and time attacks against a recovering service, and can poll the endpoint freely on a two-slot server."
    recommendation: "Return a single boolean to unauthenticated callers and expose the detailed breakdown only to requests carrying a valid trial token."
  - id: "SEC-QWEN-012"
    severity: "LOW"
    status: "probable"
    confidence: 0.7
    category: "config"
    title: "Volume-key freshness window compares a wall-clock timestamp against a monotonic event time"
    file: "mobile/src/hooks/useHardwareControls.ts"
    line_start: 47
    line_end: 47
    affected_function: "useHardwareControls"
    description: "The native module emits System.currentTimeMillis while the Kotlin policy reasons in Android eventTime, and the JavaScript layer rejects events older than 1500 milliseconds. These are different clock domains, so an NTP step or a manual clock change during a session can invalidate legitimate presses or admit stale ones."
    evidence: "MatKinhControlsModule.kt emits System.currentTimeMillis(); VolumeKeyPolicy.kt operates on eventTime; mobile/src/hooks/useHardwareControls.ts:47 applies the 1500 ms window; mobile/modules/mat-kinh-controls/index.ts:6 acknowledges the window exists."
    impact: "For a user whose only reliable input is two volume keys, dropped presses present as an unresponsive app with no spoken error, which is indistinguishable from a crash."
    recommendation: "Emit SystemClock.uptimeMillis() from the native module and compare against the same monotonic domain in JavaScript."
  - id: "SEC-QWEN-013"
    severity: "LOW"
    status: "verified"
    confidence: 0.75
    category: "credentials"
    title: "Trial token is duplicated into a second SecureStore journal and replayed after settings change"
    file: "mobile/src/services/deviceRecovery.ts"
    line_start: 33
    line_end: 61
    affected_function: "recover"
    description: "The recovery journal stores the API base URL, trial token and client request ID under a second SecureStore key so a pending task can be cancelled after a crash, reusing the old credential even after the user has rotated settings. The design is defensible and bounded by a 31-minute TTL and by errors that cannot block new credentials, but it doubles the number of places a live token rests."
    evidence: "mobile/src/services/deviceRecovery.ts:33 writes the journal; :52-58 replays the stored token and URL to DELETE the pending task; :48 applies the TTL; :59-61 ensures failures cannot block new credentials; storage uses WHEN_UNLOCKED_THIS_DEVICE_ONLY at mobile/src/hooks/useSettings.ts:39."
    impact: "A keystore compromise, or a pilot device handed to the next user without a wipe, exposes a valid token plus the server URL for up to 31 minutes after credential rotation."
    recommendation: "Clear the recovery journal on explicit logout and token rotation, and bind each journal entry to the hash of the token that created it."
---

# Technical Review Report: APEC Mắt Kính Cho Người Khiếm Thị

**Reviewer:** Qwen3.8-Max · **Target commit:** `d9ba1e0d42e1241471b1fb58df1efb9d345c6721` · **Review date:** 2026-10-30

All metrics in Section 3 are taken from the deterministic `target-metrics.json` (analyzer 2.0.0). All paths are relative to the target repository root. Every finding below was read first-hand in source; where a claim rests on inference rather than code it is labelled as such.

---

## 1. Executive Summary & Scope

### 1.1 What this project actually is

"Mắt Kính" (Vietnamese for "eyeglasses") is an **assistive vision-and-voice aid for blind and low-vision Vietnamese users**. Despite the repository name referencing glasses, the shipped artifact is an **Android smartphone app** (`com.apec.matkinh.pilot`, version 0.4.0, versionCode 8) that the user mounts on a stand pointing down at their hands and at whatever device they are trying to operate. The workflow is: press a volume key, speak a goal, press again to capture and send, then listen to a Vietnamese spoken answer or a step-by-step instruction.

Two distinct products live in this repository and the distinction matters for every judgement below:

| | **v2 "assistant"** | **v3 "device guidance"** (new in 0.4.0) |
|---|---|---|
| Question | "What is in front of me?" / "Read this label" | "How do I set the AC to 24 degrees?" |
| Shape | Single request/response per turn | Stateful multi-step task, up to 40 steps |
| Endpoints | `POST /api/v2/analyze`, `POST /api/v2/transcribe` | `POST /api/v3/assist`, `POST /api/v3/tasks/{id}/observations`, `GET /api/v3/operations/{id}`, `DELETE /api/v3/tasks/{id}` |
| State | Stateless per request | Redis-backed owner document with revision CAS |
| Knowledge | None | Curated, admin-approved device profiles in PostgreSQL |

A **third, legacy artifact** also ships: `web/` plus `app/main.py`, a browser-based WebRTC demo intended for a MacBook with Chrome. It is not the product, is not mounted by the production API, and is the single largest source of onboarding confusion (Section 5.4).

### 1.2 Readiness tier

**Unvalidated pilot.** The code is production-shaped; the evidence around it is not. Per `docs/GUIDANCE_ACCEPTANCE_040.md`, every acceptance criterion — 10 physical remotes, TalkBack, 200 percent font scaling, 20 consecutive turns on two handsets over Wi-Fi and 4G, and a study of 5 blind users across 6 tasks requiring 80 percent unassisted completion — is recorded as "Chưa thử" (not tested). `docs/IMPLEMENTATION_STATUS.md:44` adds that the Dockerfile was reviewed but never built, and that camera, microphone, SecureStore and TalkBack have never been verified natively.

That documentation is honest to an unusual degree, and this review treats it as a strength of the docs and a gap in the product simultaneously.

### 1.3 Hardware reality check (mandatory disambiguation)

The README's final section (`README.md:118-126`) introduces the **ST Electronics VL53L9CX time-of-flight sensor** — "54 x 44 pixel for 2376 individual distance zone" — with a product link and a 780 KB photograph.

**There is zero sensor-integration code in this repository.** A case-insensitive search for `vl53`, `lidar`, `tof` and `i2c` across all Python, TypeScript, TSX, Kotlin, JavaScript and JSON files returns exactly one hit: a base64 integrity hash inside `mobile/package-lock.json:10051`, which is a false positive. There is no `expo-sensors` dependency, no I²C, BLE or serial code, and no firmware directory. The project's own `docs/HARDWARE_CONTROLS_030.md:41` states that no BLE or headset hardware or protocol has been chosen yet.

The LiDAR section is therefore **aspirational prose committed by the repository's second author**, not a capability. This matters concretely: for a mobility aid, distance and obstacle detection is the highest-value sensing modality, and a reader of the README would reasonably believe some of it exists. It does not. The honest current state is monocular 2D still photography, which is precisely why `app/guidance.py:540-551` is so insistent that a photo of a remote control is never evidence that a TV changed state.

### 1.4 Verdict

The security and accessibility engineering here is materially better than the release engineering around it. A team that can write a DNS-pinning, IP-pinning, SNI-preserving, resource-limit-isolating document fetcher (`app/guidance_search.py`) and a client that refuses to speak any server string outside a 22-entry allowlist (`mobile/src/services/api.ts:18-51`) has the instincts to build a trustworthy aid for blind users. What is missing is everything that makes those instincts durable: CI, linting, type checking, dependency locking, a licence, real-user validation, and a README that describes the product instead of a demo and a sensor that does not exist.

---

## 2. Languages & Technology Stack

### 2.1 Backend (Python 3.11)

| Component | Choice | Notes |
|---|---|---|
| Web framework | FastAPI 0.117.1 / Starlette 0.48.0 | Production app disables `docs_url`, `redoc_url` and `openapi_url` (`app/mobile_api.py:176`) |
| ASGI server | uvicorn 0.36.0 with uvloop 0.22.1 | Single worker by design |
| Local STT | sherpa-onnx 1.13.8 | Zipformer-30M RNNT streaming, fp16 ONNX, CPU provider, `num_threads: 2` |
| Audio decode / resample | PyAV 17.1.0 | M4A/AAC in, mono 16 kHz float out |
| Image validation | Pillow 11.3.0 | Format, edge length and decompression-bomb checks |
| Vision LLM | Google Gemini via `httpx` 0.28.1 | Interactions API, `v1beta`, `store: false` |
| Persistence | psycopg 3.3.6 (PostgreSQL), redis 8.1.0 | Guidance only; v2 is stateless |
| Manual research | pypdf 6.20.1 + Brave Search API | Opt-in, off by default |
| WebRTC (demo only) | aiortc 1.15.0 + aioice 0.10.2 | Present in `requirements.txt`, absent from `requirements-mobile.txt` |

### 2.2 Client (TypeScript / Kotlin)

- **Expo SDK 57 / React Native 0.86.3 / React 19.2.3 / TypeScript 6.0.3**, `tsconfig.json` extends `expo/tsconfig.base` with `strict: true`.
- **State:** hand-rolled observable stores (`getSnapshot` / `subscribe`) consumed through `useSyncExternalStore` (`mobile/src/hooks/useTurnController.ts:172`) — no Redux, MobX or Zustand.
- **Native module:** `mobile/modules/mat-kinh-controls`, an Expo module in Kotlin that intercepts volume-key events, with a pure `VolumeKeyPolicy` decidable without Android imports and therefore unit-testable on the JVM.
- **Config plugin:** `mobile/plugins/withHardwareControls.js` patches MainActivity at prebuild.
- **Storage:** `expo-secure-store` with `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`; `allowBackup: false`; `usesCleartextTraffic: false`.
- **Build:** EAS, `preview` profile producing a sideloaded APK; `mobile/package-lock.json` (11,433 lines) is committed.

### 2.3 Declared versus actually used

The two Python requirement files are **coherent and honest**: `requirements-mobile.txt` is a strict subset of `requirements.txt` at identical versions, dropping exactly the aiortc/WebRTC stack that the production API does not use. This is a deliberate and correct split, since the demo and the product have different dependency surfaces.

Two hygiene issues:

1. `requirements.txt` — the file the README tells every new contributor to install — contains `pytest==8.4.2` along with its `iniconfig` and `pluggy` dependencies. Test tooling ships in the runtime manifest. It does not reach the container (`Dockerfile:18-19` installs only `requirements-mobile.txt`), so this is a developer-experience and supply-chain-surface issue rather than a production one.
2. No Python lockfile or `--require-hashes` anywhere. The 53 pins in `requirements.txt` do include an explicit transitive closure, which is better than most projects manage, but pins without hashes still resolve to different wheels across platforms and over time. Combined with the trust-on-first-use model download (SEC-QWEN-006), **the Docker image is not bit-reproducible**.

Version currency is good as of the commit date: `certifi==2026.7.22`, `cryptography==50.0.1`, `pyOpenSSL==26.4.0`, `numpy==2.3.3`, `packaging==26.3`. No dependency is obviously stale, and this review does not assert specific CVE identifiers it cannot verify. The dependency risk here is **process risk, not version risk**.

---

## 3. Quantitative Metrics & Code Scope

From `target-metrics.json` (analyzer 2.0.0, analyzed 2026-10-30, target commit `d9ba1e0`):

| Metric | Value |
|---|---|
| Total files / directories | 138 / 34 |
| Total lines | 27,525 |
| **Executable code lines** | **13,282** |
| Data lines (JSON/SQL/XML) | 11,597 |
| Comment lines | 254 |
| Documentation lines | 627 |
| Blank lines | 1,765 |

Language distribution by code lines:

| Language | Files | Code lines | Share |
|---|---|---|---|
| Python | 39 | 5,729 | 43.1% |
| TypeScript | 37 | 3,700 | 27.9% |
| TypeScript (React) | 14 | 1,747 | 13.2% |
| CSS | 1 | 758 | 5.7% |
| JavaScript | 4 | 671 | 5.1% |
| Kotlin | 4 | 333 | 2.5% |
| HTML | 1 | 122 | 0.9% |
| Shell / Gradle / Dockerfile / TOML / YAML | 7 | 109 | 0.8% |

**The 11,552 lines of JSON are almost entirely `mobile/package-lock.json`** and should be excluded from any complexity judgement — the real authored surface is roughly 13,300 lines across five languages.

### 3.1 Complexity assessment (measured, not estimated)

Backend, measured by AST over `app/*.py`:

- **231 functions.** Only **9 exceed 50 lines** and **4 exceed 80**. Median function size is small; this is not a spaghetti codebase.
- **Four complexity hotspots:** `create_admin_app` (`app/guidance_admin.py:53`, 174 lines — a whole FastAPI app with nested route handlers and inline HTML/CSS as a closure factory), `_evaluate` (`app/guidance.py:487`, 113 lines of densely nested guard clauses), `create_app` (`app/mobile_api.py:154`, 106 lines), and `submit` (`app/guidance.py:153`, 98 lines holding an owner lock across idempotency, revision, admission and frame-reservation logic).
- **Line-length discipline is absent:** 138 lines exceed 120 characters, 43 exceed 160, and `app/guidance_admin.py:32` is a **single 1,101-character line** containing the entire admin stylesheet.

Mobile, by contrast, is tight: `mobile/src` totals 2,887 lines, the largest file is `TurnController.ts` at 545 lines, and the longest function is `DeviceTaskController.runAttempt` (`:174-267`, ~93 lines, containing an inline 150-iteration / 120-second poll loop).

### 3.2 Typing and documentation discipline

| Measure | Backend (`app/`) | Mobile (`mobile/src`) |
|---|---|---|
| Strict typing | Not enforced — no mypy config | `strict: true` |
| Fully annotated functions | **116 / 231 = 50%** | n/a (inferred, strict) |
| `any` escape hatches | ~44 `Any` imports/uses | **0** occurrences of `: any`, `as any`, `<any>` |
| Function docstrings | **5 / 231 = 2%** | sparse |
| Module docstrings | 8 / 17 | n/a |

The backend picture is split. `app/main.py`, `app/session.py`, `app/vision.py` and `app/mobile_security.py` are carefully annotated. **`app/guidance.py` — the 599-line, most safety-critical module in the repository — is essentially unannotated**: `__init__`, `from_env`, `start`, `close`, `_available`, `_save`, `_acceptance`, `_run`, `_operation_status` and `_fail` all lack parameter and return types. The newest and most consequential code has the weakest mechanical guarantees, and no tool in the repository would flag that.

What the project lacks in docstrings it partly makes up for in **module-level invariant comments**, which are genuinely excellent and rare:

- `app/guidance.py:1-5` — "Media lives only in the worker coroutine. Redis contains short-lived task facts, not photos/audio."
- `app/guidance_storage.py:1-5` — "production storage never falls back to memory"
- `app/guidance_search.py:1-5` — "Fetched text is untrusted evidence, never instructions."
- `app/guidance_vision.py:1-5` — "This provider proposes observations. The orchestrator, rather than model text, owns confirmation, revision, evidence and approval gates."

These state *why*, not *what*, and they are the single best onboarding artifact in the backend.

### 3.3 Test scope

| Suite | Files | Documented passing cases |
|---|---|---|
| Python (`tests/`) | 18 | **322** (`docs/RELEASE_040.md:25`) |
| Mobile Jest (`mobile/tests/`) | 17 (2,871 lines) | **329 across 17 suites** (`docs/RELEASE_040.md:25`) |
| Kotlin JUnit | 1 | 15 `@Test` methods, run inside `assembleRelease` per `docs/RELEASE_030.md` |

The Python suite contains 158 `def test_` declarations which expand to the documented 322 through `@pytest.mark.parametrize`; the mobile suite declares roughly 240 effective cases plus `test.each` blocks. Both counts are consistent with the documentation.

**This review could not execute either suite.** The target's dependencies are not installed in the review environment (`sherpa_onnx` and `starlette` are both absent) and the local interpreter is Python 3.13, which violates the project's own `requires-python = ">=3.11,<3.12"`. The `.pytest_cache/v/cache/lastfailed` file present in the target working tree, which lists 14 test modules as failed, is an artifact of that unsupported environment — the accompanying `.pyc` files are tagged `cpython-313-pytest-9.1.1` against a project that pins `pytest==8.4.2`. **It is not evidence that the tests fail.** Test-pass counts cited in this report are the project's own documented claims, not independently reproduced results.

That said, the *content* of the tests was read, and it is well above typical pilot quality. See Section 6.3.

---

## 4. Repository Structure & Architecture

### 4.1 Directory layout and responsibility boundaries

```
app/                     16 modules, 2,867 lines — the entire backend
  config.py              leaf: paths, limits, model_config.json load
  asr.py                 leaf: sherpa-onnx ModelManager, process-wide inference lock
  bundle.py              leaf: JPEG inspection, WAV/ZIP export (demo only)
  vision.py              Gemini provider, prompt injection hardening, response validation
  mobile_security.py     leaf: TrialTokens, WorkGate/WorkLease, admission ASGI middleware
  mobile_pipeline.py     v2 orchestration: decode -> resample -> STT -> Gemini
  mobile_api.py          v2 composition root (create_app factory)
  main.py                legacy demo composition root (module-level globals)
  session.py             demo WebRTC session state machine
  guidance_contract.py   leaf: public TypedDicts, limits, command vocabulary
  guidance.py            v3 orchestrator: task lifecycle, safety gates
  guidance_api.py        v3 routes + admission middleware
  guidance_storage.py    PostgreSQL knowledge repo + Redis/memory task stores
  guidance_search.py     Brave + official-domain document fetcher (SSRF-hardened)
  guidance_vision.py     Gemini structured-output provider for v3
  guidance_admin.py      standalone localhost review UI (its own FastAPI app)
mobile/src/core/         pure TypeScript state machines, zero Expo/RN imports
mobile/src/services/     the only modules performing side effects
mobile/src/hooks/        wiring between controllers and React
mobile/src/screens/      2 screens; components/ 7 shared accessible primitives
mobile/modules/          Kotlin Expo module for volume-key capture
web/                     legacy browser demo (643-line app.js)
scripts/                 7 operational scripts
migrations/              1 SQL file
docs/                    15 Markdown files, 841 lines
tests/, mobile/tests/    35 test files
```

### 4.2 Architectural pattern

**Backend: layered composition roots with an acyclic dependency graph.** The internal import graph was extracted and contains **no cycles**. Five leaf modules (`config`, `guidance_contract`, `mobile_security`, `guidance_storage`, `guidance_search`) are imported but import nothing internal; three composition roots (`mobile_api.create_app`, `main`, `guidance_admin.create_admin_app`) wire everything else. `mobile_api.create_app(manager, vision, token_hashes, guidance)` accepts every collaborator as a parameter, which is why the test suite can inject memory stores and stub providers without monkeypatching.

**Mobile: hexagonal, and executed with real discipline.** `mobile/src/core/` imports nothing from Expo or React Native. `TurnController` declares a `TurnDependencies` interface (`TurnController.ts:12-30`) covering `now`, `uuid`, `settings`, `recorder`, `camera`, `media`, `analyze`, `transcribe`, `speak` and `cue`, so the entire 545-line state machine is testable against fakes. Staleness is handled by a monotonically incremented `generation` counter re-checked at every async continuation, with a separate `speechGeneration` guarding TTS callbacks — the standard defence against a cancelled turn speaking out of order, and `mobile/tests/turnController.test.ts:56-60` proves it works using deferred promises.

The only coupling wrinkle is `DeviceTaskController.ts:3-4` importing constants and types from `TurnController` — one-directional, not circular.

### 4.3 Mandatory disambiguation: deployment and artifact roles

**Why does a Dockerfile exist, and what does it package?** It packages the **production mobile backend only** — not the demo, not the admin UI, not the client:

- Multi-stage: stage `model` (`Dockerfile:1-8`) downloads the pinned Zipformer weights; stage `runtime` (`Dockerfile:10-30`) installs `requirements-mobile.txt`, copies only `app/`, `migrations/`, `scripts/migrate_guidance.py` and `model_config.json`, then copies the weights from the first stage.
- Runs as **`USER 10001`** (`Dockerfile:25`), a non-root user created in-image.
- Has a **HEALTHCHECK** (`Dockerfile:27-28`) hitting `/api/health` with a 60-second start period.
- **No secrets** in `ENV` or `ARG`; configuration is entirely runtime environment.
- Serves **`app.mobile_api:app`** with `--workers 1` (`Dockerfile:30`) — the single worker is load-bearing, because the `WorkGate` is process-local and the comment says so explicitly: "One process keeps the two-slot and per-token limits global for this pilot."

The admin review UI (`app/guidance_admin.py`) is **deliberately not containerised**: it must run on `127.0.0.1:8081` on the operator's own machine and is never tunnelled.

**Execution topology — what runs where:**

| Layer | Runs on | Contains |
|---|---|---|
| Phone | Android handset | Camera, microphone, on-device TTS, volume-key capture, SecureStore token. **No local inference.** |
| Edge | Cloudflare quick tunnel | Forwards port 8080 only. No auth, no rate limiting, ephemeral hostname. |
| Host | A personal MacBook | uvicorn `app.mobile_api:app` on 127.0.0.1:8080 (`scripts/run_mobile.sh:9`); uvicorn `app.guidance_admin:app` on 127.0.0.1:8081 (`scripts/run_guidance_admin.sh:6`); PostgreSQL `mat_kinh`; Redis. |
| Third-party | Google, Brave, Hugging Face, Expo | Gemini vision; optional Brave Search (off unless a key **and** `BRAVE_STORAGE_ALLOWED=true`); pinned model weights; EAS builds and APK hosting. |

The honest summary: **the container is production-ready and nothing is running it.** `docs/IMPLEMENTATION_STATUS.md:44` states the Dockerfile was never built in the author's environment, and `docs/ANDROID_SETUP.md:72-88` contains a Cloud Run recipe that has not been executed.

### 4.4 Mandatory disambiguation: media pipeline and modality

| Question | Answer | Evidence |
|---|---|---|
| Video: continuous stream or snapshots? | **Discrete still snapshots only.** No frame streaming exists in the mobile path. | `mobile/src/services/media.ts` captures single JPEGs; `app/guidance.py:204-205` rejects a reused `frame_id` or image hash |
| Where does vision inference run? | **Cloud** — Google Gemini Interactions API. No on-device or on-server vision model. | `app/vision.py:17`, `:132-150`, `:152-207` |
| Audio input (STT) or output (TTS)? | **Both.** STT is server-side and local; TTS is on-device. | STT: `app/mobile_pipeline.py:75-120` via sherpa-onnx. TTS: `mobile/src/services/speech.ts` |
| Where does ASR run? | **On the operator's server, on CPU, never in the cloud.** Raw microphone audio is decoded, resampled to mono 16 kHz and fed to Zipformer locally. Only the resulting *transcript text* is forwarded to Gemini. | `app/mobile_pipeline.py:83-114`; `app/vision.py:139-148` sends image + text only |
| Is raw audio ever sent to a third party? | **No.** | Confirmed by reading every `httpx` call site: `app/vision.py:222` and `app/guidance_search.py:172,233` are the only outbound requests |
| Are user images sent to a third party? | **Yes** — base64 JPEG to Gemini, with `store: false` on every call. | `app/vision.py:144`, `:183`; `app/guidance_vision.py:145,149` |
| Retention | Server keeps media **only inside the worker coroutine**; Redis holds task facts, never photos or audio. Client deletes audio immediately after transcription and confines all media to an app-owned cache directory wiped at startup. | `app/guidance.py:1-5` and `:300` (`image = None` in `finally`); `mobile/src/core/TurnController.ts:255-256`; `mobile/src/services/media.ts:28-43` |

This is a **genuinely privacy-forward design**: the most sensitive modality (a blind person's voice, which is biometric-adjacent and often captured inside their home) never leaves the operator's infrastructure, and the modality that must leave (images) is sent with retention disabled. The residual privacy exposure is that camera images of users' homes, hands, documents and medication do transit to Google, which is disclosed inline in the app (`HomeScreen.tsx:397`, `SettingsScreen.tsx:140`).

### 4.5 Maintainability, coupling and technical debt

**Positive:** high cohesion, no import cycles, dependency injection at both composition roots, and pure/impure separation on the client.

**Debt, in descending order of consequence:**

1. **A 545-line dead state machine.** `HomeScreen.tsx:75` hardcodes `deviceGuidance: true`, so `DeviceTaskController` is always selected and `TurnController` never runs in the shipped app. Its `confirmQuestion`, `listenConfirmation` and `openActionMenu` entry points are stubbed to no-ops in `DeviceTaskController.ts:366-371`, yet `HomeScreen.tsx:329-347` still renders the confirmation and action-menu branches. Roughly 44 test cases (`mobile/tests/turnController.test.ts`) exercise a machine that production never instantiates. Two parallel state machines covering overlapping phases is a divergence hazard, and the dead one is the better-tested of the two.
2. **Cross-module private access.** `app/guidance_vision.py:140,152,155` calls `self.provider._request(...)`, `_response_text(...)` and `_unique_object` — three private methods of `GeminiVisionProvider`. `app/guidance_admin.py:18` imports `_mentions_model`, a private function, from `guidance_search`. Refactoring `vision.py` will silently break the guidance feature.
3. **Two functions named `_matches` with different semantics.** `app/guidance_storage.py:46-51` requires exact casefolded string equality; `app/guidance.py:66-75` normalises through `spoken()` and additionally requires that a model field actually be compared. Knowledge lookup uses the first, orchestrator gating uses the second. A profile can therefore be *found* by one matcher and *rejected* by the other.
4. **Duplicated admission middleware.** `MobileAdmissionMiddleware` (`app/mobile_security.py:103-186`) and `GuidanceAdmissionMiddleware` (`app/guidance_api.py:21-64`) each implement ~50 lines of near-identical body-buffering and content-length pre-checks, and they differ subtly: the guidance version's replay iterator returns a disconnect sentinel when exhausted (`guidance_api.py:60`) while the mobile version raises `StopIteration` (`mobile_security.py:155`).
5. **Runtime invariants expressed as `assert`.** Nine occurrences (`app/asr.py:75,82,95`; `app/session.py:241,242,260,271,279,303`). These are stripped under `python -O`. The Dockerfile does not currently use `-O`, so this is latent rather than active.
6. **Monkeypatched class attributes.** `app/guidance_storage.py:398-403` assigns `owner_lock`, `load_owner` and `save_owner` onto two classes from module scope, which defeats static analysis and IDE navigation.
7. **Stale build automation.** `mobile/.eas/workflows/repack-android.yml:1` is named "Repack Android 0.2.1" and pins `build_id: 09d49b18-e597-44e5-9ca6-49c802a47cf2` at `:8` — which `docs/IMPLEMENTATION_STATUS.md:53` identifies as the **0.2.0 / code 5** build. Running it today would repack a two-major-version-old artifact under a mismatched name.
8. **Backend package identity is stale.** `pyproject.toml:6-8` declares `name = "mat-kinh-input-demo"`, `version = "0.1.0"` and describes the project as a "Local camera, microphone, and Vietnamese streaming STT input demo", while the shipped app is 0.4.0.

---

## 5. Documentation Assessment

### 5.1 Inventory

15 Markdown files, 841 lines, all in Vietnamese except `README.md:114-130`. There is **no English architecture document, no CONTRIBUTING, no SECURITY.md, no CHANGELOG and no AGENTS.md**. A non-Vietnamese-reading contributor — including the APEC partners the project name implies — cannot onboard from the docs alone.

### 5.2 What is genuinely excellent

`docs/IMPLEMENTATION_STATUS.md`, `docs/RELEASE_040.md` and `docs/GUIDANCE_ACCEPTANCE_040.md` form an **unusually rigorous evidence ledger**. They record:

- Exact test counts and dates (322 Python, 329 mobile, dated 05/10 and 14/10/2026).
- Real latency measurements with the caveat that they do not prove the target: "Server xử lý 10060 ms, gồm ASR 59 ms và Gemini 10001 ms. Đây là một smoke test trên Mac... không đủ chứng minh mục tiêu trung vị <10 giây" (`IMPLEMENTATION_STATUS.md:32`).
- **Their own failures.** `RELEASE_040.md:27` records that Gemini 3.8 returned 503s, that Flash 3.5 and 3.7 also returned 503, that only Flash Lite returned 200, and that ASR misheard "Bắt đầu hướng dẫn" as "BÁC ĐẦU HƯỚNG DẪN".
- Explicit disclaimers that synthetic fixtures are not evidence: "Các fixture mười remote trong bộ kiểm thử là dữ liệu giả, không phải chứng nhận hỗ trợ mười model thật" (`RELEASE_040.md:29`).
- That the container was never built (`IMPLEMENTATION_STATUS.md:44`).

Most production teams at this scale write release notes that claim success. These claim the opposite, with dates and numbers. That is a real documentation strength and should be preserved.

### 5.3 Version milestone delta (mandatory disambiguation)

**Critical caveat:** the repository contains only **5 commits and 2 content-bearing ones** — `589d3e8` (2026-09-28, the local web demo) and `16faf3f` (2026-10-17, a single squashed commit adding the entire mobile app, both API versions, token security, the Kotlin module, PostgreSQL/Redis persistence, Brave integration, the Dockerfile and all documentation). The remaining three are a LiDAR prose commit, its merge, and a README edit. **The 0.1.x → 0.3.0 history is therefore not reconstructable from git**; it exists only in prose and in EAS-hosted APK artifacts. There is no review trail, no bisectability, and no way to attribute any line of the guidance subsystem to a reviewed change.

Reconstructed from `docs/`:

| Version | code | Functional delta | Architectural delta |
|---|---|---|---|
| 0.1.0 | 1 | First APK from EAS | Mobile client + v2 API + token auth introduced |
| 0.1.1 | 2 | Android 15 permission and lifecycle fix (`ANDROID15_FIX.md:7-9`) | Foreground/background handling |
| 0.1.2 | 3 | Fixed `Unsupported FormDataPart implementation` (`UPLOAD_FIX_012.md:5-7`) | Switched to `expo/fetch` multipart serialisation |
| 0.1.3 | 4 | Differentiated input error messages; Android audio MIME aliases (`INPUT_FIX_013.md:8,35`) | Fixed error-code contract between client and server (`mobile_api.py:30-58`) |
| 0.2.0 | 5 | Voice-asked questions and corrections; follow-up questions on the same JPEG with up to 3 context pairs; 5-minute scene TTL | New `POST /api/v2/transcribe`; question-vs-audio mode split; shared auth and gate |
| 0.2.1 | 6 | Longer command phrases; no fuzzy command matching | 1-second endpointing padding in `app/asr.py:88` |
| 0.3.0 | 7 | **Physical volume-key control**; TalkBack-aware TTS-then-listen sequencing | New Kotlin Expo module + config plugin; two semantic commands (primary/stop) split from the adapter for future headset support |
| 0.4.0 | 8 | **Device guidance**: multi-step, evidence-gated task flow for TV and AC remotes | Entirely new v3 subsystem: `guidance*.py` (~1,600 lines), PostgreSQL knowledge base with admin review workflow, Redis task store with revision CAS, Brave-backed manual research |

0.4.0 is not an increment — it is a second product sharing an authentication layer and an admission gate with the first.

### 5.4 Front-door reality check (mandatory disambiguation)

**The README does not describe the product.** Concretely:

1. **Wrong entry point.** `README.md:33-47` walks a new user through creating a Python 3.11 venv on **macOS**, downloading a 51 MB model, and opening `http://127.0.0.1:8000` in **Chrome** to grant camera and microphone permissions. That is `app.main:app`, the legacy demo. The product is an Android APK talking to `app.mobile_api:app`. The correct pointer (`README.md:16`) is a single sentence buried above the demo instructions, and the demo then occupies the next 70 lines.
2. **Aspirational hardware presented as a section of the project.** See Section 1.3. `README.md:118-126` describes a LiDAR sensor with a spec sheet and a photograph. No code integrates it.
3. **A model default the team abandoned.** `README.md:59` and `.env.example:5` instruct `GEMINI_MODEL=gemini-3.8-flash`, and `app/vision.py:18` hardcodes the same default. But `docs/RELEASE_040.md:21` records that the team switched to `gemini-3.1-flash-lite` after 3.8 exceeded a 60-second wait, while `model_config.json` sets `timeout_seconds: 45` — three artifacts, two timeout figures, and a documented default that did not work. An operator following the README reproduces the failure the team already diagnosed.
4. **Public author confusion.** `README.md:128`, added by the second author in the most recent commit: *"I'm not sure why we need a Gemini token. Or what the v0.2.1 version of the Android app did. Or v0.3 or v0.4. You might try it out."* This is the front door of a project whose entire answer is "the Gemini key lives server-side so the APK never holds it" (`README.md:3`, `docs/MOBILE_ARCHITECTURE.md`), and whose v0.2.1/0.3/0.4 deltas are documented in six linked files directly above the sentence. An unresolved note of this kind, left in place by a different author than the one who wrote the surrounding text, signals absent editorial ownership.
5. **A false licensing premise.** `README.md:116` — see SEC-QWEN-001.
6. **Broken and machine-local references.** `docs/RELEASE_030.md:25` links `../artifacts/mat-kinh-0.3.0-source.zip`; no `artifacts/` directory exists. `docs/ANDROID_SETUP.md:8,44,74,93` hardcode `/Users/lethanh/...` paths that cannot work for anyone else. Four different expired Cloudflare tunnel URLs are published across the release docs.

**Onboarding friction score: high.** A new contributor lands on a macOS browser demo, is told to configure a model the authors could not use, reads that the licence does not matter because the repo is private when it is public, and is invited to "try out" three versions whose changes are documented elsewhere. The internal engineering docs are excellent; the front door actively works against them.

### 5.5 Code comments

Sparse but high-value where present (Section 3.2). The best comments in the repository explain a non-obvious *why* at the exact point of risk:

- `app/mobile_api.py:73-74` — why partially spooled uploads must be closed manually.
- `app/mobile_api.py:139` — "Some Android MIME tables label actual AAC/M4A bytes as audio/mpeg."
- `app/mobile_security.py:62` — why a cancelled request may no longer await its worker.
- `app/guidance.py:224-225` — why a frame is reserved until completion.
- `app/guidance.py:236-237` — why admission must also be released from a done-callback.
- `app/guidance_storage.py:218-219` — why the lineage lock precedes row locks.
- `app/asr.py:87` — why one second of tail padding is required for short Vietnamese utterances.
- `mobile/src/services/guidanceApi.ts:41` — "Server details are never shown directly: a compromised proxy must not inject speech."

---

## 6. Security & Vulnerability Analysis

### 6.1 Attack surface

| Surface | Authentication | Bounds | Verdict |
|---|---|---|---|
| `POST /api/v2/analyze`, `POST /api/v2/transcribe` | Bearer SHA-256 trial token | 4 MiB / 2 MiB body, 2 files, 3 fields, 4 KiB per field, per-token 1 concurrent, global 2 | **Strong** |
| `/api/v3/*` | Same token, owner-scoped | 2 MiB + 64 KiB body, 1 file, 5 fields | **Strong** |
| `GET /api/health` | None | n/a | Discloses subsystem readiness (SEC-QWEN-011) |
| `app.main:app` (demo) | **None** | Single global session | Unauthenticated Gemini proxy (SEC-QWEN-003) |
| `app.guidance_admin:app` | Shared token + HMAC session + CSRF | Loopback host **and** client, 256 KiB form cap, CSP | **Strong**, no throttling (SEC-QWEN-010) |
| Client → server | Token in SecureStore | HTTPS-only, validated per request | **Strong** |

**Input validation is the standout.** Every boundary is defended with allowlists rather than denylists: `turn_id` and identifiers must match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}` (`mobile_api.py:80`, `guidance.py:43`); questions are 1–1000 characters and must survive UTF-8 encoding (`mobile_api.py:86-92`); conversation context is capped at 3 turns, 4,096 UTF-8 bytes, exactly the keys `{question, answer}`, with duplicate JSON keys rejected via `object_pairs_hook` (`mobile_api.py:95-130`); images must be JPEG, at most 1280 px per edge (v2) or 2048 px (v3), at least 8 px, and must survive `verify()` with decompression bombs escalated from warning to error (`mobile_pipeline.py:122-136`, `guidance.py:29-39`). Body size is enforced **before** the multipart parser runs, including for chunked requests with no `Content-Length` (`mobile_security.py:126-151`).

**SQL injection: not present.** Every query in `app/guidance_storage.py` is parameterised (`:161,171,187,192-198,214-230`), including the advisory-lock call which passes the lineage id as a bound parameter rather than interpolating it.

**XSS: not present in either UI.** The admin app escapes every interpolation through `html.escape(..., quote=True)` and sets `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'` (`guidance_admin.py:27-32`). The demo front end renders every server-supplied string — transcripts, AI answers, errors — through `textContent`; a search for `innerHTML`, `insertAdjacentHTML`, `document.write` and `eval(` across `web/app.js` returns zero hits, and path identifiers are wrapped in `encodeURIComponent` (`web/app.js:94`).

### 6.2 The controls worth calling out

Three pieces of security work here exceed what is normal for a project of this age and size:

**SSRF defence (`app/guidance_search.py:93-194`).** The fetcher rejects any scheme but HTTPS, any URL carrying credentials or a non-443 port, and any host that is `localhost` or ends in `.local`/`.internal`/`.localhost`. It resolves DNS **once**, requires *every* returned address to be `is_global`, then connects to a pinned IP while passing `sni_hostname` and an explicit `Host` header so TLS hostname verification still functions. Redirects are re-validated against the official-domain allowlist on each hop and capped at three. Response size is checked from `Content-Length` and re-checked while streaming. PDF parsing — the one genuinely dangerous operation, given malformed content streams — is **executed in a separate Python subprocess** under `RLIMIT_CPU` of 5 seconds and `RLIMIT_AS`/`RLIMIT_DATA` of 512 MB, with a 6-second `wait_for` and a `kill()` in `finally` (`:136-153`, `:280-295`). The comment at `:139-140` explains exactly why: a timeout must terminate the CPU work, not abandon a running thread while holding the server's AI capacity lease. Search itself is capped at two queries and three documents, and is disabled entirely unless both an API key and an explicit `BRAVE_STORAGE_ALLOWED=true` storage-rights confirmation are present (`:202-214`).

**Prompt-injection defence, three layers.** Layer one, the system instructions: `app/vision.py:33-34` states that the user's transcript and text visible in the image are untrusted context and must not be followed when they demand changes to these rules; `app/vision.py:47-50` extends this to prior Q&A turns and explicitly forbids fabricating answers; `app/guidance_vision.py:16-19` adds that web pages and JSON fields are untrusted and that hidden instructions in images or documents must not be followed. Layer two, structural: all Gemini calls request `response_format` with a closed JSON schema (`additionalProperties: false`, every property required, enums for `category`/`image_view`/`action_type`/`requested_view`), and `validate_decision` (`guidance_vision.py:84-112`) re-checks the parsed object against the same schema in Python, rejecting unknown keys, non-boolean booleans, oversized strings and arrays over 30 items. Layer three, and the most original: **the client refuses to speak anything the server did not say in one of 22 approved phrasings.** `mobile/src/services/api.ts:18-51` matches server `detail` strings against a `Set` and substitutes a fixed fallback otherwise; `mobile/src/services/guidanceApi.ts:41` comments that "a compromised proxy must not inject speech"; and `DeviceTaskController.ts:28` further requires that any surfaced message contain Vietnamese diacritics and be at most 600 characters. For an app whose entire output channel is a voice in a blind person's ear, treating that channel as an injection target is exactly right, and this is the first assistive codebase this reviewer has seen defend it.

**Deterministic safety gates on AI output (`app/guidance.py:533-592`).** The orchestrator does not trust the model's judgement about safety. It rejects any instruction containing a centimetre measurement, any count of presses greater than one, any compound phrasing ("sau đó", "rồi bấm", "đồng thời", "và bấm", "giữ nút"), more than one press verb, or a press verb at all during a `locate` step — raising `unsafe_instruction` and preserving the current step rather than guessing (`:587-592`). It requires an *orientation verified against a tactile landmark* before naming a button, explicitly rejecting colour, printed labels and corner position as tactile evidence (`:579-583`, reinforced in the prompt at `guidance_vision.py:29-34`). It refuses to advance without an exact model match, declining to use a "similar model" manual (`:570-571`). It stops before final confirmation for factory reset, data wipe, content purchase and password entry, and will not ask for or repeat a password (`:533-535`). And it will not accept a photograph of the remote as evidence that the television changed state, requiring a fresh image of the target screen (`:540-551`). The verification vocabulary is explicit and three-valued — `visually_verified`, `user_reported`, `unverified` (`guidance_contract.py:20-22`) — so the app can always say "I could not confirm that worked."

### 6.3 Test suite as a security artifact

The test names alone reveal a security-driven mindset, and reading the bodies confirms it:

- `test_transcribe_has_no_auth_bypass_or_missing_config_bypass` — attempts to reach the STT path without a token or with tokens unconfigured.
- `test_up_to_ten_hashes_and_constant_time_comparison`, `test_revoked_token_removed_on_restart`, `test_invalid_token_configuration_fails_readiness`.
- `test_content_length_rejected_before_parser`, `test_chunked_actual_body_limit_precedes_multipart_parser` — size enforcement ordering.
- `test_upload_files_closed_before_pipeline_runs`, `test_partial_multipart_files_closed_on_cancellation` — file-descriptor and temp-file hygiene.
- `test_input_error_log_identifies_missing_speech_without_private_data`, `test_input_error_log_classifies_bad_image_without_logging_file` — **asserting what the logs do not contain.**
- `test_one_active_per_token_two_global_no_queue`, `test_transcribe_and_analyze_share_one_gate_no_queue`, `test_disconnected_upload_cancels_answer_and_keeps_cpu_slot_until_finished`.
- `test_analysis_requires_configured_api_and_health_omits_key`, `test_analysis_discards_response_if_turn_changes`, `test_analysis_discards_reset_turn_even_if_turn_id_is_reused`.
- `tests/test_guidance.py:298-303` raises `StorageUnavailable` carrying a PostgreSQL DSN with embedded credentials and asserts the word "secret" never reaches the user-facing error; `:433` asserts a synthetic API key never appears in a serialised payload; `tests/test_evaluate_mobile.py:55` asserts the benchmark report contains neither the answer, the token, nor a planted "LEAK" string.
- `tests/test_guidance.py:117` parametrises ten adversarial fixtures — universal remote, blurred label, rotated remote, occluded buttons, wrong-model manual, target screen outside frame, unchanged menu, sensitive reset — under the name `test_ten_synthetic_remote_cases_do_not_fabricate_success`.
- On the client, `mobile/tests/api.test.ts:72,80` drives the **real** Expo winter FormData serializer and asserts byte-level multipart output including that the token does not appear in the body.

**Coverage gaps:** no tests exist for `mobile/src/hooks/useSettings.ts` (SecureStore persistence and serialisation races), `mobile/src/core/errors.ts`, or the `GuidancePanel`, `ToggleRow` and `ChoiceOption` components (never imported by any test). Screen tests mock `useTurnController` wholesale, so hook-to-screen integration is stubbed. Backend-side, the demo path is covered by only 6 test functions across `test_api.py`, `test_session.py` and `test_webrtc.py` for ~550 lines of stateful audio code — though `test_webrtc.py:70` is a genuine two-peer end-to-end test that transports a photo and audio and finalises a bundle, and `test_analysis_api.py` adds 9 more covering the analysis staleness rules. No test anywhere covers a `WorkLease` whose worker never returns (SEC-QWEN-004). There is **no coverage measurement configured** — no `--cov`, no `coverage` dependency, no threshold.

### 6.4 Secrets and credentials management

**No secret is committed anywhere.** A pattern scan for `AIza…`, `sk-…`, `ghp_…`, `BSA…` and PEM headers across all tracked files returns nothing. `.gitignore` is thorough: `.env*` (with `!.env.example`), `pilot-token*.txt`, `guidance-admin-token*.txt`, `backend*.env`, `*.jks`, `*.keystore`, `mobile/credentials.json`, `models/`, `recordings/`, `artifacts/`.

Token handling is correct end to end. `scripts/create_trial_token.py:38` generates 256 bits via `secrets.token_urlsafe(32)`; only the SHA-256 digest is written to `.env`, atomically via a temp file and `os.replace`; the plaintext is written once to a separate file with `O_CREAT|O_EXCL` and mode `0600`, refusing to overwrite an existing file; at most 10 tokens, no duplicates. Server-side, `TrialTokens` (`app/mobile_security.py:19-46`) **fails closed** — a malformed, empty, over-long or duplicated hash list yields `ready = False` and a 503 rather than an open door — and comparison uses `hmac.compare_digest` over all stored digests without early exit. Client-side, the token lives in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, `allowBackup: false`, and a validated shape (`settings.ts:22`).

**Important calibration for the consensus:** the deterministic analyzer recorded **five MEDIUM "Hardcoded Credentials in Assignment" flags** in `tests/test_evaluate_mobile.py`, `tests/test_guidance.py` (×2), `tests/test_mobile_vision.py` and `tests/test_vision.py`. **All five are false positives.** Each flagged assignment is a synthetic canary inside a leak-prevention test — the value `"private-token-value"` at `test_evaluate_mobile.py:38` exists so that `:55` can assert it never reaches the report; `api_key="synthetic-secret-key"` at `test_guidance.py:422` exists so `:433` can assert it never appears in a serialised payload. These are not leaked credentials; they are tests that leaked credentials do not leak. Any consensus score that treats them as findings penalises the project for its best security practice.

**Two residual credential observations**, both LOW: the plaintext pilot token persists on the host filesystem by design (`create_trial_token.py:50`), and the client duplicates the live token into a second SecureStore recovery journal for up to 31 minutes after rotation (SEC-QWEN-013).

### 6.5 Data management and persistence

**v2 is stateless**; nothing survives a request except logs.

**v3 uses two external stores, both hard requirements with no silent fallback.** `task_store_from_env()` returns `RedisTaskStore()` and `knowledge_from_env()` returns `KnowledgeRepository()` (`app/guidance_storage.py:406-411`); the memory implementations are labelled "Explicit test adapter. Never selected by environment configuration" (`:55`) and are reachable only through constructor injection in tests. `KnowledgeRepository.start()` refuses any database whose name is not exactly `mat_kinh` (`:129`), and `scripts/migrate_guidance.py:19-20` enforces the same, so a misconfigured DSN cannot migrate or query another application's database.

**Schema quality is high.** `migrations/001_guidance.sql` defines CHECK constraints on status, action, version positivity and `jsonb_typeof`, foreign keys, a unique `(lineage_id, version)` constraint, a GIN index on the `profile` column, a status index, and an **immutability trigger** blocking edits to content, version or lineage so that every change produces a new draft row. A column-by-column comparison against the queries in `app/guidance_storage.py:161-230` found **no drift**.

**Concurrency control is correct and non-obvious.** Version allocation and review both take `pg_advisory_xact_lock(hashtextextended(lineage_id, 0))` *before* row locks, with a comment explaining that this prevents cross-version approval deadlocks and obsolete-version fallback (`:218-220`). Approving a version suspends all previously approved versions of the same lineage atomically in one statement (`:226`). Redis revisions use a **Lua script** for compare-and-set (`:343-346`) so admission and revision checks are one atomic round trip, and owner-scoped locking uses `SET NX` with a 5-second timeout and non-blocking acquire, returning `owner_busy` rather than queueing (`:370-387`). Records carry `IDLE_TTL = 600` and `HARD_TTL = 1800`, and task expiry is enforced on read (`app/guidance.py:133-140`).

**Idempotency is handled properly.** Each request carries a `client_request_id`; the fingerprint of `(transcript, frame_id, image_hash, task_id, expected_revision)` is stored with it, so a retried request returns the original acceptance while a *reused* id with different content is rejected 409 `request_reused` (`app/guidance.py:161,171-176`). Cancellation writes a tombstone under the same owner lock, so a phone that never received its 202 can still cancel exactly the task it admitted (`:379-418`). Frames are reserved until completion and released only on failure, so a frame that advanced a revision can never advance another (`:224-228`, `:420-423`).

**Two persistence concerns:**

1. **Knowledge lookup is an O(approved profiles) scan per step.** `lookup_approved` calls `list_profiles("approved")`, which selects up to 500 rows ordered by creation date, then filters in Python (`app/guidance_storage.py:154-156`). The GIN index on `profile` is not used by this query. At pilot scale this is invisible; at a few thousand profiles it becomes the dominant cost of every guidance step.
2. **No connection pooling.** `_connection()` opens a fresh `psycopg.AsyncConnection` per operation (`:140-146`) and `close()` is a no-op (`:137-138`). Each guidance step performs several operations, each a new TCP + TLS + auth handshake to PostgreSQL.

Neither is a defect today; both are ceilings.

### 6.6 Performance and concurrency

The concurrency model is deliberate and documented: a single event loop, one uvicorn worker, `asyncio.to_thread` for all CPU-bound work, and a two-slot admission gate with **no queue** — the 429 tells the client to retry rather than letting latency accumulate silently. For a two-user pilot with a blind user waiting on a spoken answer, refusing fast is the right choice.

**Bottlenecks, in order of impact:**

1. **ASR is serialised process-wide.** `app/asr.py:24` holds a single `threading.Lock` across `accept_waveform` and every `decode_stream` call (`:76-79`, `:83-92`), and `finish()` additionally decodes one full second of zero padding (`:88-89`). Effective STT parallelism is therefore **1**, not 2. This is coherent with `num_threads: 2` in `model_config.json` and with the gate's design — the second slot is meant to be waiting on Gemini while the first decodes — but it means the advertised capacity of 2 is really "1 CPU + 1 network".
2. **No lease timeout** (SEC-QWEN-004) and **no horizontal scaling** (SEC-QWEN-005).
3. **A new `httpx.AsyncClient` per Gemini call** (`app/vision.py:221`), so every inference pays a fresh TCP and TLS handshake to Google. With measured Gemini latencies of 5.8–10.0 seconds (`IMPLEMENTATION_STATUS.md:32,38`) the handshake is noise, but it is free to fix with a shared client.
4. **Quadratic audio buffering in the demo path.** `app/session.py:245` does `self.pending = np.concatenate((self.pending, samples))` per resampled chunk while also appending every chunk to `self.turn.audio_samples` (`:243`). A 60-second turn is ~600 concatenations of a growing array plus double retention of the samples. Bounded and demo-only, but wasteful.
5. **Measured end-to-end latency is 6.3–8.1 seconds per turn** (`RELEASE_040.md:27,38`), against a stated median target under 10 seconds, **never measured on a handset or a mobile network**. The target is unproven, and the ASR serialisation above is the most likely reason it will not hold with two simultaneous users.

### 6.7 The exact-match command dead end (product-fitness defect)

This is the finding most likely to affect a real blind user, and it is verified end to end.

The spoken command vocabulary is **six exact phrases** (`app/guidance_contract.py:53-60`): "bắt đầu hướng dẫn", "đổi mục tiêu", "hủy hướng dẫn", "đã làm", "chưa tìm thấy", "nghe lại bước này". `command()` (`:63-64`) looks the normalised transcript up in that dictionary and returns `None` on any mismatch. The normalisation at `:47-50` folds case and punctuation only — and its docstring states the design choice explicitly: *"never fuzzy-match a consequential command."* That choice is correct; acting on a near-miss "cancel" would be worse than ignoring it.

The problem is what happens on a miss. Traced through the code:

1. `submit` computes `action = command(transcript)` → `None` (`app/guidance.py:157`).
2. At `:210-212`, because `task_id` is set, the phase is `confirm_goal`, a goal exists, and `action != "confirm"`, the branch evaluates `local = True` — so **no lease is acquired and no AI is called**. The response is a fixed string.
3. `_evaluate` reaches `:494-495` and returns `self._result(task, "confirm_goal", f"Mục tiêu: {task['goal']}. Nói Bắt đầu hướng dẫn, Đổi mục tiêu hoặc Hủy hướng dẫn.")` — **the identical prompt the user just heard**.

So a user in the `confirm_goal` phase who says anything other than one of six exact phrases hears the same instruction again, with no indication that their speech was misheard, and no escalation. The team has already observed the trigger: `docs/RELEASE_040.md:27` records that "Bắt đầu hướng dẫn" was transcribed as "BÁC ĐẦU HƯỚNG DẪN" — a vowel difference that diacritic folding cannot bridge. The same doc notes the app correctly refused to treat it as consent, which is the safety behaviour working; but the user is then left in a loop they cannot diagnose by ear.

**Recommendation:** keep exact matching for the action itself, but distinguish "unrecognised command in a command-expecting phase" from "free-form utterance". When `phase == "confirm_goal"` and `action is None`, return a distinct spoken message — "Tôi chưa nghe rõ lệnh. Hãy nói lại chính xác: Bắt đầu hướng dẫn" — and after two consecutive misses, announce the on-screen fallback buttons that `docs/VOICE_CONTEXT_020.md` says already exist for TalkBack users. This costs one branch at `app/guidance.py:494`, requires no AI call, and preserves the no-fuzzy-match invariant.

### 6.8 Accessibility verdict

For an app whose users cannot see the screen, accessibility is not a feature — it is the product. The implementation holds up:

- **Accessible names and roles are centralised**, which is why a raw count of 24 accessibility props across 2,887 lines understates the coverage. Every control routes through a shared primitive: `ActionButton` (`accessibilityRole="button"`, label defaulting to visible text, `accessibilityState {disabled, busy}`), `ToggleRow` (role `switch` with `checked`, the inner `Switch` hidden via `no-hide-descendants` so it is not announced twice), `ChoiceOption` (role `radio`), `AppText` (heading levels mapped to the `header` role, `allowFontScaling` respected), `StatusNotice` (`accessibilityLiveRegion` polite or assertive). **No unlabeled interactive element was found.**
- **Touch targets are 56–88 dp** (`ActionButton.tsx:38-40`, inputs 64 dp), comfortably above the 48 dp guideline — appropriate for users who may not see what they are touching.
- **TalkBack is a first-class state, not an afterthought.** Screen-reader status is tracked and fed into the controller (`useTurnController.ts:176-178`, `TurnController.setScreenReader`); when TalkBack is active, TTS is handed to `AccessibilityInfo.announceForAccessibility` instead of the app's own speaker so the user does not hear everything twice (`speech.ts:13-15`); `AccessibilityManager.interrupt()` is restricted to explicit user action behind a window-focus guard (`MatKinhControlsModule.kt:27-40`); focus is contained when the Settings modal opens (`HomeScreen.tsx:288-289`); the camera preview is excluded from the accessibility tree (`:380`); and `ReduceMotion.System` is honoured (`StateTransition.tsx`).
- **Volume-key capture coexists with TalkBack by construction.** The dispatcher resets its policy on any touch or hover event (`HardwareControlsDispatcher.kt:85-98`), so TalkBack's explore-by-touch gestures always win over key interception, and key chords pass through to the system. `VolumeKeyPolicy` is a pure Kotlin object with no Android imports, and `VolumeKeyPolicyTest.kt` covers chords, debounce, orphan releases and cancelled events — 15 JVM tests that run inside `assembleRelease`.

**Gaps** (both minor, and inferred rather than observed on a device): nothing calls `setAccessibilityFocus` to move focus to an answer when it arrives, so the app relies on the live region and TTS; and the transcript is rendered `selectable` (`HomeScreen.tsx:375`), which behaves awkwardly under TalkBack. Neither is verifiable without a handset — which is exactly what `docs/GUIDANCE_ACCEPTANCE_040.md` records as never done.

---

## 7. Actionable Recommendations & Roadmap

### 7.1 Immediate (this week — blocks any external use)

1. **Add a `LICENSE` and `NOTICE`, and delete the false claim.** The repository is publicly readable and ships no licence; `README.md:116` asserts otherwise. Choose Apache-2.0 for compatibility with the sherpa-onnx runtime, add a NOTICE covering third-party components, and record an explicit decision on the CC BY-NC-ND weights. *(SEC-QWEN-001)*
2. **Get the weights out of the image, or get permission for them.** `Dockerfile:7` bakes CC BY-NC-ND weights into a redistributable artifact, which also forbids the quantisation needed for the latency target. Mount a volume or download at first boot under operator acceptance, and start evaluating an Apache-2.0 Vietnamese streaming ASR alternative. *(SEC-QWEN-002)*
3. **Lock the legacy demo down or delete it.** `app.main:app` is an unauthenticated proxy for a paid API key with session export endpoints, guarded only by a README sentence — while `app/guidance_admin.py:75-83` already contains the loopback middleware that would fix it. Reuse that middleware, or remove `app/main.py`, `app/session.py`, `app/bundle.py` and `web/` from the production image entirely. *(SEC-QWEN-003)*
4. **Rewrite the README front door.** Lead with the Android app and `app.mobile_api:app`; move the macOS Chrome demo to `docs/DESKTOP_DEMO.md`; delete or clearly mark the VL53L9CX section as future work with no code; fix the `GEMINI_MODEL` default to the model the team actually runs; remove the unresolved author-confusion paragraph at `README.md:128` or answer it.
5. **Commit expected model digests.** Add the SHA-256 of all four weight files to `model_config.json` and fail on mismatch, so integrity does not depend on whichever machine fetched first. *(SEC-QWEN-006)*

### 7.2 Short term (30 days — makes the quality durable)

6. **Add CI.** A single GitHub Actions workflow running `pytest`, `jest`, `tsc --noEmit`, `compileall` and `node --check` on every push would mechanically enforce invariants that currently depend on one developer remembering to run `scripts/check.sh` — which itself hardcodes `.venv/bin/python` and cannot run on Windows (`scripts/check.sh:5`).
7. **Configure the tooling that already ships.** Add `[tool.ruff]` (line length 120), `[tool.mypy]` and `[tool.pytest.ini_options]` to `pyproject.toml`, plus a coverage threshold. Start by annotating `app/guidance.py`, where 50 percent of the backend's annotation gap and all of the safety logic live.
8. **Break the exact-match command dead end.** Return a distinct "I did not catch that" message when a command was expected and none matched, and announce the fallback buttons after two misses. One branch at `app/guidance.py:494`. *(Section 6.7)*
9. **Add a lease deadline.** A 90-second reaper that force-releases a stuck `WorkLease` and logs it converts a permanent outage into a recoverable one. Add the missing test for a worker that never returns. *(SEC-QWEN-004)*
10. **Delete or wire up the dead state machine.** Either remove `TurnController` and its 44 tests and the unreachable branches at `HomeScreen.tsx:329-347`, or make `deviceGuidance` a real runtime setting. Two overlapping machines is a divergence hazard. *(Section 4.5)*
11. **Fix the stale automation and metadata.** `mobile/.eas/workflows/repack-android.yml:1,8` is named 0.2.1 and pins a 0.2.0 build id; `pyproject.toml:6-8` still describes a 0.1.0 input demo; `docs/RELEASE_030.md:25` links a nonexistent `artifacts/` path; `docs/ANDROID_SETUP.md` hardcodes `/Users/lethanh/...`.
12. **Stop depending on Starlette internals.** Replace `parser._files_to_close_on_error` (`app/mobile_api.py:75`, `app/guidance_api.py:85`) and `request._body` (`app/guidance_admin.py:97`) with supported APIs or `getattr` defaults, and let CI catch the next rename. *(SEC-QWEN-008)*

### 7.3 Medium term (60–90 days — makes it a product)

13. **Deploy to a real host.** The Cloud Run recipe already exists at `docs/ANDROID_SETUP.md:72-88` and the container already runs as a non-root user with a healthcheck. Replace the four rotating trycloudflare URLs with one stable authenticated domain before distributing another APK. *(SEC-QWEN-007)*
14. **Run the acceptance checklist that already exists.** `docs/GUIDANCE_ACCEPTANCE_040.md` is a complete, well-designed protocol — 10 physical remotes, three regional Vietnamese accents, TalkBack at 200 percent font, 20 consecutive turns on two handsets over Wi-Fi and 4G, and 5 blind users across 6 tasks at 80 percent completion. Every row says "Chưa thử". Executing it is the single highest-value activity remaining, and it is the only thing that can convert this from an unvalidated pilot into evidence.
15. **Move admission control to Redis.** Redis is already a hard dependency; a Redis-backed semaphore with separate pools for guidance and v2 removes the two-user ceiling and the cross-feature starvation, and makes horizontal scaling possible. *(SEC-QWEN-005)*
16. **Make the audit trail accountable.** Replace the literal `"local-admin"` reviewer (`app/guidance_admin.py:175,212,221`) with an authenticated operator identity and add login throttling. Knowledge profiles become spoken instructions for blind users; approving one should be attributable. *(SEC-QWEN-010)*
17. **Close the two persistence ceilings.** Push identity matching into SQL so the GIN index is used instead of scanning up to 500 approved profiles in Python per step (`app/guidance_storage.py:154-161`), and add a `psycopg` connection pool (`:140-146`). Unify the two `_matches` implementations while doing so. *(Section 4.5)*
18. **Publish one English architecture document.** The internal Vietnamese release docs are excellent evidence ledgers; a single English overview of the topology, the v2/v3 split, the media pipeline and the threat model would make the project reviewable by the APEC partners its name invokes.

---

## Appendix A: Corrections to prior consensus claims

This reviewer read `app/guidance_storage.py` in full and offers two evidence-based corrections for the consensus synthesis:

1. **Guidance persistence is not SQLite or in-memory.** A prior report describes guidance sessions as relying on "local SQLite/in-memory storage" with a "database connection [that] opens [a] local file SQLite instance". The code contains no SQLite anywhere. `knowledge_from_env()` returns a `KnowledgeRepository` whose DSN defaults to `postgresql:///mat_kinh` and which **refuses to start** against any database not named `mat_kinh` (`app/guidance_storage.py:121,129`); `task_store_from_env()` returns `RedisTaskStore()` against `GUIDANCE_REDIS_URL` (`:298,406-411`). The `MemoryKnowledgeRepository` and `MemoryTaskStore` classes are documented as "Explicit test adapter. Never selected by environment configuration" (`:55`) and are reachable only via constructor injection in tests. Container restarts therefore do **not** drop guidance state; it lives in PostgreSQL and Redis.
2. **The five analyzer "Hardcoded Credentials" flags are false positives**, not MEDIUM secret findings. Each is a synthetic canary inside a leak-prevention assertion (Section 6.4).

## Appendix B: Review limitations

- Neither test suite could be executed: `sherpa_onnx` and `starlette` are not installed in the review environment, and the available interpreter (Python 3.13) violates the target's `requires-python = ">=3.11,<3.12"`. All pass counts are the project's documented claims.
- No Android device, emulator, TalkBack runtime, camera, microphone, PostgreSQL, Redis or Gemini key was available. All accessibility, latency and native-module conclusions are from source reading, and are labelled inferred where applicable.
- No dependency-vulnerability scanner was run. Version currency is assessed from pin values and commit date only; **no CVE identifiers are asserted** anywhere in this report.
- The `.pytest_cache/` and `__pycache__/` directories present in the target working tree are untracked local artifacts of an unsupported interpreter and were disregarded as evidence of code state.
