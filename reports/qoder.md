---
model: "Qoder"
model_id: "qoder"
target_repo: "APEC Mắt Kính Cho Người Khiếm Thị (Smart Glasses for the Blind)"
target_commit: "d9ba1e0d42e1241471b1fb58df1efb9d345c6721"
review_date: "2026-10-30"
scores:
  overall: 8.1
  architecture: 8.7
  code_quality: 8.3
  security: 7.8
  documentation: 6.6
summary: >-
  A carefully engineered assistive pilot for Vietnamese blind and low-vision users. The operational
  product is an Expo/React Native phone app backed by a FastAPI service that performs local Zipformer
  speech-to-text, sends discrete JPEG snapshots plus text to Gemini, and drives a stateful remote-control
  guidance workflow. Boundary controls are unusually strong for a pilot: authentication precedes body
  parsing, request and multipart limits are explicit, media decoding is bounded, the document fetcher is
  SSRF-hardened, guidance revisions are immutable and owner-scoped, and the container runs non-root.
  The main risks are lifecycle and operations rather than memory-safety classes: static non-expiring
  trial tokens, no per-token rate limit, an unauthenticated legacy WebRTC demo retained in the tree,
  a missing repository license alongside CC BY-NC-ND model weights, trust-on-first-use model downloads,
  and a client that accepts any HTTPS backend URL. Documentation is deep but the front door is the weakest
  part: the root README leads with a local desktop demo, the product is a phone app rather than glasses,
  the LIDAR hardware is aspirational, and version deltas are scattered.
key_strengths:
  - "Clean separation between the production mobile API (app.mobile_api:app), the local WebRTC demo (app.main:app), and the loopback-only knowledge-review console (app.guidance_admin:app), with a deliberately smaller production dependency set."
  - "Defense in depth at the request boundary: bearer authentication before body parsing, constant-time digest comparison, fail-closed token configuration, byte and multipart caps, exact field-set validation, MIME checks, JPEG dimension limits, decompression-bomb rejection, and 60-second audio sample ceilings."
  - "Privacy-conscious media design: speech recognition runs locally on CPU through Zipformer, raw audio is never sent to Gemini, vision uses discrete snapshots rather than continuous video, Gemini requests set store=false, and no image or audio bytes are persisted in task state."
  - "A rigorous guidance state machine with owner locks, revision CAS, idempotency fingerprints, bounded step counts, sensitive-action stops, tactile-landmark requirements, and a human approval gate before knowledge profiles are shared."
  - "Accessibility-specific client engineering: hardware volume-key controls that are foreground-only, generation-based cancellation, a SecureStore recovery journal, fixed error messages, and a no-retry-on-ambiguous-state policy."
  - "A hardened research path: official-domain allowlist, DNS resolution pinned to a public IP, redirect revalidation, document size caps, script/style stripping, and a resource-limited PDF extraction subprocess."
  - "Operational hygiene: fully pinned Python dependencies, a committed npm lockfile, a pinned Hugging Face revision, no committed production secrets, a multi-stage non-root image, and a health endpoint that exposes readiness booleans rather than secrets."
key_weaknesses:
  - "Trial tokens are static and non-expiring; revocation is an environment edit plus process restart, with no expiry, last-used, or per-token audit trail."
  - "There is no per-token or per-IP rate limit. The WorkGate controls concurrency only, so a single valid token can monopolize one of two slots indefinitely and consume Gemini quota."
  - "The unauthenticated legacy WebRTC demo and its media/export endpoints remain in the source tree and image, creating a sensitive-data and single-session denial-of-service risk if the demo is ever exposed."
  - "The repository has no LICENSE, NOTICE, or SPDX headers, while the bundled Zipformer weights are CC BY-NC-ND 4.0; release docs also publish a public archive path although the README calls the repository private."
  - "Model downloads are trust-on-first-use: no expected SHA-256 is pinned in model_config.json, and the manifest records whatever the first download produced."
  - "The mobile client accepts any user-entered HTTPS backend and then sends the bearer token and camera/audio data to it, which is a meaningful social-engineering surface for assistive users."
  - "The admin console's localhost check trusts the Host header and socket peer, which is bypassable behind a local reverse proxy; login throttling is absent."
  - "The root onboarding path is misleading: it documents a desktop browser demo first, contains author uncertainty about versions and the Gemini token, presents VL53L9CX LIDAR as if it were part of the product, and leaves version deltas scattered across many Vietnamese documents."
  - "There is no CI/CD pipeline, no automated dependency or secret scanning, no coverage gate, and no reproducible device acceptance record; the full suites could not be executed in this review environment."
security_findings:
  - id: "SEC-QODER-001"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.94
    category: "auth"
    title: "Unauthenticated legacy WebRTC demo retains session seizure and media export endpoints"
    file: "app/main.py"
    line_start: 65
    line_end: 203
    affected_function: "create_offer, delete_session, image, audio, export"
    description: >-
      app.main defines a complete local demo with no authentication on any route. POST /api/webrtc/offer
      accepts an arbitrary SDP, creates or replaces the single global active_session, and returns its UUID.
      DELETE /api/sessions/{id}, GET /api/sessions/{id}/turns/{turn_id}/image, GET .../audio, and
      GET .../export then expose captured camera frames, microphone WAV, and a ZIP bundle to any caller
      that has the session UUID. The Dockerfile copies the whole app/ directory, so main.py and session.py
      ship in the image even though the production CMD starts app.mobile_api:app. The production
      requirements-mobile.txt omits aiortc, so the demo is not runnable in the default container, but it is
      runnable on a host that installs requirements.txt, which the root README instructs users to do.
      Because only one demo session may exist, an unauthenticated peer can also hold the slot and force
      409 responses for the legitimate operator.
    evidence: |-
      app/main.py:
        @app.post("/api/webrtc/offer")
        async def create_offer(request: Request) -> JSONResponse:
            ...
            if active_session and not active_session.closed ...:
                raise HTTPException(409, "Đã có một phiên demo đang hoạt động")
            ...
            return JSONResponse({"session_id": session.id, ...})

        @app.get("/api/sessions/{session_id}/turns/{turn_id}/image")
        async def image(session_id: str, turn_id: str) -> Response:
            session = await _get_session(session_id)
            return Response(session.image, media_type="image/jpeg", ...)

      Dockerfile:
        COPY app/ app/
        CMD ["sh", "-c", "exec uvicorn app.mobile_api:app ..."]

      requirements-mobile.txt: no aiortc; requirements.txt: aiortc==1.15.0
    impact: >-
      If the demo is exposed on a LAN, a tunnel, or a misconfigured host, an unauthenticated network peer
      can occupy the only session, read the blind user's camera snapshots and microphone recording, download
      the turn ZIP, and terminate sessions. This is sensitive media and a trivial denial of service. The
      default container command does not expose these routes, so the finding is conditional on operator
      behavior rather than exploitable in the shipped CMD.
    recommendation: >-
      Move the demo into a separate package or directory that is excluded from the runtime image, or mount
      its routes only when an explicit DEMO_MODE flag is set and require the same bearer authentication.
      Remove the media/export routes from any network-reachable build, or gate them behind an authenticated
      local operator. Add a negative test asserting that app.mobile_api exposes no /api/webrtc or
      /api/sessions routes, and make the README state unambiguously that the demo is not part of the
      production service.

  - id: "SEC-QODER-002"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.97
    category: "auth"
    title: "Trial tokens never expire and revocation requires an environment edit plus restart"
    file: "app/mobile_security.py"
    line_start: 19
    line_end: 46
    affected_function: "TrialTokens.__init__, TrialTokens.identify"
    description: >-
      TrialTokens stores up to ten SHA-256 digests parsed from TRIAL_TOKEN_HASHES. The digests have no
      issuance time, expiry, owner label, last-used timestamp, or revoked flag. Identification is a
      constant-time comparison loop over the current tuple, which is good, but the only revocation path is
      to edit the environment and restart the process. The architecture document states this explicitly.
      Tokens are also shared secrets rather than per-person credentials, so a leaked token cannot be
      attributed or selectively expired without restarting the service for everyone.
    evidence: |-
      app/mobile_security.py:
        class TrialTokens:
            def __init__(self, hashes: str) -> None:
                values = [value.strip() for value in hashes.split(",") if value.strip()]
                self._hashes = tuple(values) if (
                    1 <= len(values) <= 10 and len(set(values)) == len(values)
                    and all(re.fullmatch(r"[a-f0-9]{64}", value) for value in values)
                ) else ()

            def identify(self, authorization: str) -> str | None:
                ...
                digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
                for expected in self._hashes:
                    if hmac.compare_digest(digest, expected):
                        matched = expected
                return matched

      docs/MOBILE_ARCHITECTURE.md: "Thu hồi cần đổi cấu hình và restart process."
    impact: >-
      A token copied from a test device, chat message, or screen recording remains valid indefinitely.
      There is no way to expire a single pilot participant, no audit of which token made a request, and no
      short-lived credential to limit blast radius. A compromised token also consumes the same shared
      concurrency and Gemini budget as a legitimate user.
    recommendation: >-
      Replace the environment tuple with a small token table (PostgreSQL or Redis) containing token_hash,
      owner_label, issued_at, expires_at, revoked_at, and last_used_at. Issue short-lived tokens with a
      refresh path or a pilot expiry date. Add an admin-only revoke operation that takes effect on the next
      request, and log the owner label with each request code. Keep the current fail-closed parsing and
      constant-time comparison.

  - id: "SEC-QODER-003"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.94
    category: "availability"
    title: "No per-token rate limit; one valid token can monopolize shared capacity and buffer v3 bodies"
    file: "app/mobile_security.py"
    line_start: 76
    line_end: 122
    affected_function: "WorkGate.acquire, MobileAdmissionMiddleware.__call__"
    description: >-
      WorkGate enforces a global capacity of two and one lease per token identity, but it has no rate,
      quota, or fairness window. A token can issue sequential requests forever and hold a slot for the
      duration of ASR plus Gemini, so two tokens can starve every other pilot user. The v2 middleware
      acquires the lease before reading the body, which is good, but the v3 GuidanceAdmissionMiddleware
      authenticates and then buffers up to MAX_BODY_BYTES (about 2 MiB) before GuidanceService.submit
      acquires a WorkGate lease. A valid token can therefore open many concurrent v3 uploads and create
      memory pressure before admission control applies. Unauthenticated health checks and 401 attempts are
      also unbounded, although they are cheap.
    evidence: |-
      app/mobile_security.py:
        def acquire(self, identity: str) -> WorkLease | None:
            if len(self._leases) >= self.capacity or identity in self._leases:
                return None
            ...

        lease = self.gate.acquire(identity)
        if lease is None:
            await self._error(scope, receive, send, 429, "Đang xử lý lượt khác. Hãy thử lại sau.")

      app/guidance_api.py:
        # authenticates, then reads the whole body into memory
        while True:
            message = await receive()
            total += len(message.get("body", b""))
            if total > MAX_BODY_BYTES: ...
        await self.app(scope, replay, send)

      app/guidance.py (inside submit, after the body has already been parsed):
        lease = self.gate.acquire(owner)
    impact: >-
      A single trial participant can deny service to the other participant and burn Gemini quota with a
      loop of valid requests. A malicious or buggy client can also cause avoidable memory and CPU pressure
      by opening many v3 uploads. The impact is bounded by authentication and the two-slot gate, but the
      control is concurrency-only, not abuse-resistant.
    recommendation: >-
      Add a token-bucket or sliding-window limiter keyed by token identity and, at the ingress, by client
      IP (for example 6 requests per minute and a daily cap per trial token), returning 429 with Retry-After.
      Apply the same admission lease before reading v3 bodies, or add a separate bounded upload gate. Add
      alerting on 429/401 rates and on per-token Gemini spend. If the pilot grows beyond one process, move
      admission and quotas to a shared Redis-backed gate rather than multiplying the in-process capacity.

  - id: "SEC-QODER-004"
    severity: "MEDIUM"
    status: "probable"
    confidence: 0.70
    category: "auth"
    title: "Admin localhost guard trusts the Host header and socket peer, so a local proxy can expose approval actions"
    file: "app/guidance_admin.py"
    line_start: 74
    line_end: 99
    affected_function: "local_only"
    description: >-
      The knowledge-review console decides whether a request is local by parsing the Host header and
      comparing request.client.host with a loopback set. Both values are weak authorization signals. If the
      console is placed behind a reverse proxy or relay that runs on the same host, request.client.host is
      127.0.0.1 for every remote request, and the Host header can be forged to localhost. The launch script
      binds the app to 127.0.0.1, which blocks direct remote connections, but the guard is the only defense
      if that binding is changed or a local proxy is added. Login also has no throttling; the admin secret
      is required to be at least 24 characters, which makes brute force impractical but not impossible if
      the secret is weak or reused.
    evidence: |-
      app/guidance_admin.py:
        host = request.headers.get("host", "").lower()
        hostname = urlsplit("http://" + host).hostname
        client = request.client.host if request.client else ""
        if hostname not in {"127.0.0.1", "localhost", "::1"} or client not in {"127.0.0.1", "::1", "testclient"}:
            return _page("<p class='error'>Trang duyệt chỉ mở trên máy chủ localhost.</p>", 403)

      scripts/run_guidance_admin.sh:
        exec .venv/bin/python -m uvicorn app.guidance_admin:app --host 127.0.0.1 --port 8081 ...
    impact: >-
      Knowledge profiles approved through this console become guidance used by blind users. If the console
      is accidentally proxied, a remote party could approve, suspend, or edit draft profiles, undermining the
      human review gate. The loopback bind substantially reduces the likelihood, hence probable rather than
      verified.
    recommendation: >-
      Keep the loopback bind and document it as an invariant. Do not use Host or socket peer as the primary
      authorization decision; require the admin secret on every state-changing request (or an HMAC-signed
      request), not only at login. Add login throttling and an idle timeout. If TLS termination is ever added,
      set the cookie Secure flag and verify the exact configured origin rather than a derived base URL.
      Consider binding to a Unix socket or a dedicated loopback port with firewall rules.

  - id: "SEC-QODER-005"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.96
    category: "licensing"
    title: "No repository license while model weights are CC BY-NC-ND 4.0; visibility claims are contradictory"
    file: "README.md"
    line_start: 107
    line_end: 116
    affected_function: "License and model-source documentation"
    description: >-
      The repository has no LICENSE, COPYING, or NOTICE file at its root. The README explicitly says the
      repository license is still missing and that the project is currently private. At the same time, the
      0.4.0 release document links a public GitHub archive path for the source. The bundled Zipformer weights
      are identified as CC BY-NC-ND 4.0, which prohibits commercial use and distribution of derivatives; the
      sherpa-onnx runtime is Apache-2.0. Without a root license, default copyright applies to the code and
      no permission is granted to copy, modify, or distribute it, even for a pilot. The contradiction between
      private and public distribution statements makes the actual confidentiality and licensing posture
      unclear.
    evidence: |-
      README.md:
        ## License of this repository

        It is still missing, follow the guidance above from other repositories. Currently a private
        repository, so of no concern.

      README.md:
        Model: hynt/Zipformer-30M-RNNT-Streaming-6000h; license weights theo model card: CC BY-NC-ND 4.0.
        STT runtime: sherpa-onnx; license code runtime: Apache-2.0.

      docs/RELEASE_040.md:
        [Tải source hiện tại trên GitHub](https://github.com/thanh1912-ut/.../archive/refs/heads/main.zip)
    impact: >-
      A commercial pilot or public distribution has no code license and cannot rely on the NC-ND model
      weights. Contributors and testers have no clear grant. If the repository is in fact public, the README's
      privacy statement is inaccurate and may mislead users about the exposure of source, documentation, and
      release links. If it is private, the public archive link is stale or broken. Either way, legal and
      onboarding risk is material.
    recommendation: >-
      Add a root LICENSE (for example Apache-2.0 or MIT for the code) plus a NOTICE that separately records
      the Zipformer CC BY-NC-ND 4.0 terms, the sherpa-onnx Apache-2.0 terms, and any dataset terms. Add SPDX
      headers to source files. State repository visibility accurately in the README and release notes, and
      remove public archive links if the project is private. If commercial use is intended, replace the
      NC-ND model or obtain explicit permission; do not assume the runtime license covers the weights.

  - id: "SEC-QODER-006"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.92
    category: "supply_chain"
    title: "Model download is trust-on-first-use; no expected SHA-256 is pinned"
    file: "scripts/download_model.py"
    line_start: 34
    line_end: 65
    affected_function: "main"
    description: >-
      The download script pins a Hugging Face revision, which is better than tracking main, but it does not
      verify the downloaded files against a digest that is committed independently. It reads any previous
      manifest, compares the cache only when the revision matches and an expected digest exists, and
      otherwise downloads the file, computes its SHA-256, and writes that digest into the new manifest. A
      compromised upstream account, a malicious model repository, or a first-build interception therefore
      becomes the trusted baseline. The Docker build performs this download at image build time, so the
      image inherits the same first-use trust. Python packages are pinned but installed without
      --require-hashes, so the same first-use concern applies at a lower level.
    evidence: |-
      scripts/download_model.py:
        previous = json.loads(manifest_path.read_text(...)) if manifest_path.exists() else {}
        previous_files = previous.get("files", {}) if previous.get("revision") == revision else {}
        for filename in config["files"]:
            expected = previous_files.get(filename, {}).get("sha256")
            is_valid_cache = bool(expected) and cached_path.is_file() ...
            ...
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            downloaded[filename] = {"path": ..., "size_bytes": ..., "sha256": digest}

      Dockerfile:
        RUN python scripts/download_model.py --model-dir /opt/zipformer
    impact: >-
      A tampered model can alter transcription, consume excess CPU, or produce misleading guidance, and the
      manifest will bless it. Because the model runs locally and its output feeds a safety-sensitive
      guidance flow, integrity matters more than for a typical demo asset. The exposure is limited to a
      compromised upstream or first download, hence medium severity.
    recommendation: >-
      Commit expected SHA-256 values for all four files in model_config.json and verify each download before
      use; fail closed on mismatch. Store the expected hashes separately from the generated manifest, sign
      the manifest if it is distributed, and consider a reproducible download test in CI. Pin pip installs
      with a hash-checked requirements lock for the image build, and pin the base image by digest.

  - id: "SEC-QODER-007"
    severity: "MEDIUM"
    status: "verified"
    confidence: 0.88
    category: "network"
    title: "Client accepts any HTTPS backend and sends the trial token plus camera and audio data to it"
    file: "mobile/src/core/settings.ts"
    line_start: 9
    line_end: 18
    affected_function: "normalizeBaseUrl"
    description: >-
      normalizeBaseUrl validates only that the value parses as an HTTPS URL without embedded credentials,
      query, or fragment. Any host is accepted. api.ts then sends Authorization: Bearer <trialToken> and a
      multipart body containing a JPEG and audio or transcript to that host. There is no allowlist, pinned
      certificate, signed remote configuration, or host-change confirmation. Settings are user-editable,
      and the target user may rely on spoken setup or assistance from another person, which makes a
      social-engineering attack ("enter this server address") plausible.
    evidence: |-
      mobile/src/core/settings.ts:
        export function normalizeBaseUrl(value: string): string {
          const input = value.trim();
          let url: URL;
          try { url = new URL(input); }
          catch { throw new Error('Nhập địa chỉ máy chủ HTTPS trong Cài đặt.'); }
          if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
            throw new Error('Địa chỉ máy chủ phải dùng HTTPS, không chứa mật khẩu hoặc tham số.');
          }
          return input.replace(/\/+$/, '');
        }

      mobile/src/services/api.ts:
        const response = await fetch(`${normalizeBaseUrl(settings.apiBaseUrl)}${path}`, {
          headers: { Authorization: `Bearer ${settings.trialToken}` }, ...
        });
    impact: >-
      A user who is tricked into entering an attacker-controlled HTTPS endpoint will transmit a valid trial
      token and sensitive camera/audio content. The attacker can then reuse the token against the real
      service and retain the media. The client's otherwise careful error handling and SecureStore storage do
      not mitigate this, because the destination itself is untrusted.
    recommendation: >-
      For the pilot, pin the expected backend host or a signed allowlist in the app configuration, and
      require an explicit spoken and visual confirmation when the host changes. Consider certificate
      pinning or app attestation for the production build. If self-hosted servers must remain supported,
      separate that build flavor and add a prominent host-verification step. Never re-send the token
      automatically after a host change.

  - id: "SEC-QODER-008"
    severity: "LOW"
    status: "verified"
    confidence: 0.99
    category: "information_disclosure"
    title: "Setup documentation hard-codes a developer's absolute home path"
    file: "docs/ANDROID_SETUP.md"
    line_start: 8
    line_end: 93
    affected_function: "Android setup commands"
    description: >-
      Four setup commands use an absolute path under a named user's home directory. This leaks a local
      username and machine layout into the repository, and it guarantees that copy-paste onboarding fails on
      any other machine. It is a documentation and minor information-disclosure issue, not a runtime
      vulnerability.
    evidence: |-
      docs/ANDROID_SETUP.md contains four `cd` commands that begin with a hard-coded
      developer home-directory prefix before the repository folder name, repeated for
      the repository root and the mobile directory.
    impact: >-
      New operators must edit commands before they work, which increases onboarding friction and encourages
      ad-hoc path changes. The exposed username is low sensitivity but unnecessary.
    recommendation: >-
      Replace absolute paths with a repository-root variable such as REPO_ROOT="$(git rev-parse
      --show-toplevel)" or relative commands. Add a short prerequisite section for Python 3.11, Node, and
      Android tooling, and test the commands from a clean clone.

---

# Technical Review: APEC Mắt Kính Cho Người Khiếm Thị

**Reviewer:** Qoder  
**Inspection date:** 2026-10-30  
**Target snapshot:** `target/APEC_mat_kinh_cho_nguoi_khiem_thi` at `d9ba1e0`  
**Deterministic metrics:** 138 files, 34 directories, 27,525 total lines, 13,282 code lines, 254 comment lines, 627 documentation lines, 11,597 data lines. Python is the largest language (39 files, 5,729 code lines), followed by TypeScript (37 files, 3,700 code lines), React TypeScript (14 files, 1,747 code lines), CSS (1 file, 758 code lines), JavaScript (4 files, 671 code lines), Kotlin (4 files, 333 code lines), and HTML (1 file, 122 code lines). The analyzer reports no CI/CD configuration.

**Scope note:** This review evaluates only the external repository in `target/`. The `review1` harness, its scripts, and its dashboard are not the subject. No report was fabricated for any model that was not run.

---

## 1. Executive Verdict and Readiness Tier

**Readiness tier: advanced pilot / pre-production.** This is not a toy. The code shows deliberate threat modeling, bounded resource use, a real accessibility feedback loop, and a guidance workflow that treats model output as a proposal rather than a command. It is also not production-ready: credential lifecycle, abuse controls, licensing, release engineering, and device acceptance are incomplete.

The most important architectural clarification is that the product is a **smartphone application**, not smart glasses. The phone camera captures a still image, the phone microphone captures a short recording or the app accepts a confirmed transcript, the backend transcribes locally, and Gemini answers a question about the snapshot. The v3 workflow adds a stateful remote-control guidance loop for televisions and air conditioners. The "Mắt Kính" name and the root README's LIDAR section describe an intended future form factor, not an implemented one.

The system has three distinct runnable surfaces, and conflating them is the main source of onboarding confusion:

| Surface | Entry point | Intended exposure | Role |
|---|---|---|---|
| Production mobile API | `app.mobile_api:app` | Public HTTPS behind a token-aware ingress | Serves `/api/v2` and `/api/v3` to the Android app |
| Local WebRTC demo | `app.main:app` | Loopback or a private LAN only | Desktop browser camera/microphone QA harness |
| Knowledge review console | `app.guidance_admin:app` | Loopback `127.0.0.1:8081` only | Human approval of guidance knowledge profiles |

The Docker image starts only the first. The second is a development tool that should not be deployed. The third is a separate local process. The root README mostly documents the second, which is the single largest documentation defect in the repository.

**Score rationale**

| Dimension | Score | Rationale |
|---|---:|---|
| Overall | 8.1 | Strong engineering and a coherent safety model, offset by pilot-grade credential, abuse, licensing, and release gaps |
| Architecture | 8.7 | Clear layers, explicit boundaries, and a well-designed guidance state machine; legacy demo entanglement and a single-process gate are the main deductions |
| Code quality | 8.3 | Consistent typing, explicit errors, bounded parsing, and good naming; a few very large modules, private Starlette API use, and no lint/type gate in CI |
| Security | 7.8 | Excellent boundary and privacy controls, but static tokens, no rate limiting, a legacy unauthenticated demo, admin guard assumptions, and supply-chain trust gaps |
| Documentation | 6.6 | Deep and honest Vietnamese documentation, but a misleading front door, scattered version deltas, stale paths, ephemeral links, and aspirational hardware presented alongside operational code |

---

## 2. Project Identity and Purpose

**Problem domain.** The application helps a blind or low-vision Vietnamese speaker ask "what is in front of me?" and receive a spoken description, then optionally receive step-by-step help operating a television or air-conditioner remote. The interaction is designed around large targets, speech, haptics, and hardware volume keys rather than a conventional touch UI. The README describes the target user and the accessibility intent clearly.

**Operational scope.** The implemented client is an Expo SDK 57 / React Native application for Android. The implemented server is a Python 3.11 FastAPI service. The implemented model stack is a local Zipformer streaming recognizer plus a cloud Gemini vision-language model. The implemented guidance domain is remote-to-appliance operation with a human-reviewed knowledge base.

**Hardware reality check.** There is no glasses hardware, no wearable camera, and no integrated LIDAR in the operational code. The only LIDAR references are in the root README and the associated image; the text says the sensor "has to be analyzed" and describes it as future work. The Git history contains a merge from a `ToF` branch whose commit message is "Information about ToF LIDAR sensor to be integrated." The device controls are phone volume keys plus an on-screen interface, not a custom remote or a headset. The "Smart Glasses" phrasing in the repository name is therefore aspirational and should be labeled as such wherever it appears.

**Front-door reality.** The README opens with the local camera/microphone demo, then documents the model, license, LIDAR idea, and screenshots. The production mobile flow, the v3 guidance flow, the admin console, and the deployment topology are documented in separate files. The screenshot section contains the author's own uncertainty: "I'm not sure why we need a Gemini token. Or what the v0.2.1 version of the Android app did. Or v0.3 or v0.4." That is candid, but it is not an onboarding guide. A new engineer can easily start the wrong app or expose the wrong surface.

**Maturity.** The snapshot has five commits and one tag (`v0.1.0`). The latest commit is README-only. The documentation records a rapid sequence of Android releases from 0.1.0 through 0.4.0, with dated smoke tests and acceptance gaps. This is an actively iterated pilot with a small team, not a mature open-source project with a stable release process.

---

## 3. Technology Stack and Runtime

| Layer | Technology | Version / notes |
|---|---|---|
| Server runtime | Python | `>=3.11,<3.12`; container uses `python:3.11.16-slim-bookworm` |
| Web framework | FastAPI / Starlette / Uvicorn | FastAPI 0.117.1, Starlette 0.48.0, Uvicorn 0.36.0; one worker |
| ASR | sherpa-onnx + Zipformer | sherpa-onnx 1.13.8; `hynt/Zipformer-30M-RNNT-Streaming-6000h` at a pinned revision |
| Audio decode | PyAV / FFmpeg | av 17.1.0; resamples to mono 16 kHz |
| Image handling | Pillow | 11.3.0; JPEG validation and dimension limits |
| HTTP client | httpx | 0.28.1; Gemini and Brave calls |
| Persistence | PostgreSQL, Redis | psycopg 3.3.6, redis 8.1.0; guidance tasks and approved profiles |
| Document extraction | pypdf | 6.20.1; bounded PDF subprocess |
| Vision / reasoning | Gemini Interactions API | Default `gemini-3.8-flash`; release notes record a temporary `gemini-3.1-flash-lite` deployment |
| Mobile | Expo SDK 57 / React Native / TypeScript | TypeScript 6 with `strict: true`; Jest and Testing Library |
| Mobile native | Kotlin | Hardware volume-key dispatcher and Expo config plugin |
| Desktop demo | Vanilla JavaScript / aiortc | WebRTC browser demo, local only |
| Container | Docker multi-stage | Non-root UID 10001, one worker, healthcheck |

**Declared versus imported dependencies.** The production dependency set is deliberately smaller than the development set. `requirements-mobile.txt` excludes `aiortc` and `pytest`, so the production container cannot import the WebRTC demo modules. `requirements.txt` includes the demo, tests, and WebRTC stack for local work. That split is good design, but it is not obvious from the root README.

**Metadata drift.** `pyproject.toml` still names the project `mat-kinh-input-demo`, version `0.1.0`, and describes a "Local camera, microphone, and Vietnamese streaming STT input demo." The operational product is an Android application with a v3 guidance service. The package metadata should not be used to infer the current product scope.

**Runtime compatibility.** Python is constrained to 3.11, which matches the container. Node is not pinned in a `engines` field; the lockfile pins the JavaScript dependency graph, but the Node major version is not declared. The Android build uses Expo SDK 57 and React Native 0.86 through `app.config.ts` and EAS. The backend and mobile versions are developed together but versioned separately.

---

## 4. Architecture and Repository Layout

### 4.1 Layout

```
app/
  mobile_api.py          production API: /api/v2 analyze + transcribe, health
  mobile_security.py     token digests, WorkGate, v2 admission middleware
  mobile_pipeline.py     image/audio validation, ASR, Gemini answer composition
  vision.py              Gemini Interactions client, schemas, error mapping
  asr.py                 Zipformer model manager and stream lifecycle
  guidance_api.py        v3 routes and admission middleware
  guidance.py            guidance orchestrator, phases, revisions, owner locks
  guidance_contract.py   limits, commands, identity normalization
  guidance_vision.py     guidance JSON schema and provider
  guidance_storage.py    PostgreSQL knowledge repository, memory/Redis task stores
  guidance_search.py     official-document search and hardened fetcher
  guidance_admin.py      loopback-only human review console
  main.py                local WebRTC desktop demo
  session.py             demo session state machine and media export
mobile/
  src/core/              settings, recovery, device task controller, types
  src/services/          API, guidance API, media, speech, credential handling
  src/screens/           Home and Settings
  modules/               Kotlin hardware-key module
  plugins/               Expo config plugin that patches MainActivity
migrations/
  001_guidance.sql       knowledge profiles, lineages, immutability trigger
scripts/                 model download, token creation, migrations, launchers
tests/                   Python API, pipeline, guidance, storage, security tests
web/                     desktop demo assets
```

### 4.2 Layers and boundaries

The server has a clean dependency direction:

1. **Transport and admission.** `mobile_api.py` and `guidance_api.py` parse HTTP, enforce content types and multipart limits, and attach an authenticated owner or lease to the request scope.
2. **Security primitives.** `mobile_security.py` owns token comparison, the concurrency gate, and the v2 admission middleware. It has no domain knowledge.
3. **Media pipeline.** `mobile_pipeline.py` validates and decodes media, calls the local recognizer, and composes the Gemini request. It depends on `asr.py` and `vision.py`, not on HTTP.
4. **Inference adapters.** `vision.py` and `guidance_vision.py` own prompt construction, JSON schemas, response validation, and upstream error mapping.
5. **Domain orchestration.** `guidance.py` owns task phases, revisions, idempotency, owner locks, and the decision to advance, repeat, stop, or complete. It depends on storage, vision, and search through explicit interfaces.
6. **Persistence.** `guidance_storage.py` implements immutable PostgreSQL knowledge revisions and Redis or in-memory task stores. The migration encodes the uniqueness and immutability constraints.
7. **Research.** `guidance_search.py` performs bounded Brave searches and official-document fetches. It is optional and disabled without a key plus an explicit storage-rights confirmation.

The client mirrors this separation: screens do not call `fetch` directly; services own HTTP; `DeviceTaskController` owns task generation and cancellation; `settings.ts` owns URL and credential validation; `deviceRecovery.ts` owns the SecureStore journal.

### 4.3 Data flow

```
Android camera (still JPEG) ──┐
Android microphone (M4A/AAC) ─┼─► HTTPS multipart ─► mobile_api
Confirmed transcript ─────────┘        │
                                      ├─ v2: admission (token, lease, byte caps)
                                      │      ├─ PyAV decode → mono 16 kHz → Zipformer → transcript
                                      │      └─ JPEG + transcript/question + optional context → Gemini
                                      │             └─ structured Vietnamese answer → phone TTS
                                      │
                                      └─ v3: admission (token) → GuidanceService
                                             ├─ task/revision/owner lock in Redis or Postgres
                                             ├─ optional approved knowledge profile
                                             ├─ Gemini guidance decision (JSON schema)
                                             └─ operation polling → phone speaks next step

Desktop browser ◄── WebRTC (local demo only) ──► app.main ──► same ASR + Gemini adapters
Human reviewer ◄── loopback HTML ──► app.guidance_admin ──► PostgreSQL knowledge profiles
```

### 4.4 Modality map

| Modality | Direction | Processing location | Persistence |
|---|---|---|---|
| Camera | Input | Phone captures a discrete JPEG on a button press; no continuous video stream | Not persisted server-side; only SHA-256 and frame IDs for guidance deduplication |
| Microphone | Input | Phone records a short M4A/AAC clip; PyAV decodes it; Zipformer transcribes on the server CPU | Raw audio is not persisted; it is discarded after transcription |
| Question text | Input | Phone sends a confirmed transcript or typed question | Not persisted as history; v2 context is ephemeral per request |
| Speech output | Output | Android TTS on the device | No server-side audio output |
| Vision | Inference | Gemini cloud API receives JPEG + text; `store=false` | No image history; request/response not retained by the app |
| Guidance knowledge | Reference | PostgreSQL approved profiles; drafts are owner-scoped | Persisted, versioned, immutable after review |
| Research documents | Reference | Brave search + official-domain fetch; text is untrusted evidence | Fetched text can be stored as source evidence with SHA-256; search is disabled by default |

The vision path is **discrete snapshot inference**, not continuous video understanding. The audio path is **input speech-to-text only**; there is no server-side TTS or audio generation. The ASR is local; the language model is cloud. That split is a deliberate privacy and latency trade-off and is one of the strongest parts of the design.

### 4.5 Version delta map

The documentation records the functional sequence, but it is spread across `README.md`, `docs/IMPLEMENTATION_STATUS.md`, and the release notes. The concrete deltas are:

| Version | Main functional delta | Operational evidence |
|---|---|---|
| 0.1.0–0.1.3 | Initial Android pilot: image + audio + transcript flow, token auth, EAS APK, Android 15 and upload fixes | Release notes record APK builds and a 0.1.3 input-error fix |
| 0.2.0 | Voice question editing, three context pairs, separate transcription endpoint, structured image feedback | Python 216 and Jest 176 test counts recorded |
| 0.2.1 | Longer voice command phrases and a no-fuzzy-match rule | 184 mobile tests, four synthetic-image Gemini checks |
| 0.3.0 | Foreground-only hardware volume-key control, speech/TalkBack sequencing, command menu | 270 Jest tests, JUnit policy tests, signed APK |
| 0.4.0 | v3 remote-control guidance: tasks, revisions, pending actions, tactile landmarks, approved knowledge profiles, admin console, bounded research | 322 Python / 329 mobile test counts recorded; real-device acceptance still incomplete |

The repository does not have a single table that explains this progression. The README does not mention v3 at all. That is a documentation defect rather than an implementation defect.

---

## 5. Code Quality and Maintainability

**Typing and style.** Python modules consistently use `from __future__ import annotations`, explicit return types, `TypedDict` for the public guidance contract, and narrow helper functions. TypeScript has `strict: true`, and the mobile tests compile against the same configuration. There is no `ruff`, `mypy`, `eslint`, or `prettier` configuration in the repository, and no lint step in a CI pipeline. The type checker is therefore the only automated style gate, and it is not enforced by CI.

**Error handling.** The code generally maps expected failures to explicit HTTP status codes and fixed Vietnamese messages, logs only stable codes, and avoids leaking upstream details. Examples include the v2 error-code map, `VisionError` mapping, `GuidanceError` mapping, and the mobile client's allowlist of server messages. Boundary `except Exception` blocks are used in model loading and WebRTC setup, where they are logged and converted to a controlled failure; this is acceptable. The guidance research path intentionally swallows fetch failures per candidate, which is appropriate for best-effort evidence collection.

**Size and complexity hotspots.** The largest modules are:

| File | Lines | Assessment |
|---|---:|---|
| `app/guidance.py` | 599 | Cohesive but large; phase policy, admission, persistence, and response composition are interleaved |
| `app/guidance_storage.py` | 411 | Two repository implementations plus Redis Lua; cohesive but dense |
| `mobile/src/core/DeviceTaskController.ts` | 372 | Generation-based cancellation and polling; complex but directly tested |
| `app/session.py` | 341 | Demo-only WebRTC state machine; not production-critical |
| `app/vision.py` | 301 | Two prompt/schema paths (demo and mobile) plus transport; could split adapters |
| `app/guidance_search.py` | 295 | Security-sensitive fetcher and search collector; dense but well-commented |

The highest-value refactor is `app/guidance.py`: extract the phase policy (`confirm_goal`, `identify`, `step`, `completed`) into pure functions with explicit inputs and table-driven tests, and keep the service responsible for locking and persistence. That would make the safety rules easier to audit without changing behavior.

**Fragility and minor issues.**

- `app/guidance_admin.py` assigns `request._body`, a private Starlette attribute. This works with the pinned version but is not a stable interface. A public body-caching middleware or a dependency that reads the stream once would be safer.
- The admin console builds HTML with inline strings. Escaping is applied and the CSP is strong, but a small template layer would reduce the chance of a future unescaped interpolation.
- `guidance_search.py` uses the Unix-only `resource` module inside the PDF subprocess. The deployment target is Linux/macOS, so this is acceptable, but the code is not portable to Windows without a fallback.
- The demo and production share `vision.py` and `asr.py`. That is reasonable, but the demo's `vision.analyze` path still exists in the production module and is only separated by call sites, not by packaging. Moving demo-only code out would reduce the production import surface.
- `pyproject.toml` metadata is stale, as noted above.
- Comments are sparse (254 comment lines across 13,282 code lines), but the code is generally self-documenting. The comments that do exist explain non-obvious invariants, such as the ASR tail padding and the deferred CPU cancellation.

**Maintainability verdict.** Good. The code is readable, consistently structured, and defensively written. The main risks are not cleverness or hidden control flow; they are the absence of automated linting, the size of the guidance orchestrator, and the retention of demo code in the production tree.

---

## 6. Dependencies and Supply Chain

**Pinning.** Direct Python dependencies are pinned to exact versions in `requirements.txt`, `requirements-mobile.txt`, and `pyproject.toml`. The mobile dependency graph is locked in `mobile/package-lock.json`. The model revision is pinned in `model_config.json`. This is better than most pilots.

**Reproducibility gaps.**

- `requirements.txt` is a fully resolved list, but pip installs are not hash-checked (`--require-hashes` is absent). A compromised package index or a replaced artifact at the same version would not be detected.
- The Docker base image is pinned by tag (`python:3.11.16-slim-bookworm`), not by digest.
- The model download is trust-on-first-use (see SEC-QODER-006).
- There is no SBOM, no `pip-audit`, no `npm audit`, no Dependabot/Renovate configuration, and no CI pipeline. The analyzer's `ci_cd` inventory is empty and there is no `.github/workflows` directory.
- `huggingface_hub` is installed only in the model build stage, which is good, but the model build itself has no independent integrity check.

**Dependency hygiene.** The production mobile requirements deliberately exclude the WebRTC and test stacks, which reduces attack surface. The full requirements include `pytest`, `aiortc`, `uvloop`, `watchfiles`, and other development dependencies; that file should not be used for the public runtime. The separation is documented in `requirements-mobile.txt` but not in the root README.

**Secrets.** No production secret, private key, or real API key was found in the repository. The deterministic analyzer's five "Hardcoded Credentials" flags are all in test modules and are fixture values, not live credentials. `.env.example` contains placeholders. The server reads `GEMINI_API_KEY`, `TRIAL_TOKEN_HASHES`, `GUIDANCE_ADMIN_TOKEN`, `GUIDANCE_DATABASE_URL`, `GUIDANCE_REDIS_URL`, and `BRAVE_*` from the environment. The token-creation script writes a hash to `.env` and a plaintext token to a mode-600 file outside the source bundle. That is a sensible pilot pattern, but it depends on operators keeping the plaintext file off backups and chat.

**Verdict.** Good pinning and a thoughtful production dependency split, but weak integrity verification and no automated vulnerability or freshness checks.

---

## 7. Testing and Quality Assurance

**Inventory.** The repository contains 18 Python test modules under `tests/`, with 158 test functions and 42 `pytest.mark.parametrize` decorators. The mobile side contains 17 Jest suites under `mobile/tests/`, with 216 static test declarations and extensive table-driven `test.each` usage. The 0.4.0 release notes report 322 Python tests and 329 mobile tests across 17 suites; those totals are consistent with parametrized expansion, so I do not treat them as inflated. I could not execute either suite in this review environment: the target's Python virtual environment is absent, `mobile/node_modules` is absent, and PostgreSQL/Redis are not running. The numbers above are static counts, not a claim that the suites pass here.

**Coverage of the important paths.** The test layout suggests strong coverage of the security and boundary behavior:

- Authentication, missing/malformed tokens, multiple Authorization headers, and fail-closed configuration.
- Multipart field sets, duplicate fields, oversized bodies, MIME aliases, image dimensions, and audio duration.
- ASR tail handling and stream lifecycle.
- Gemini request construction, response-schema validation, upstream error mapping, empty/blocked results, and turn changes while waiting.
- Guidance task revisions, owner isolation, idempotency, pending actions, sensitive-action stops, and step limits.
- SSRF defenses: private addresses, redirects, official-domain enforcement, size caps, and model-number matching.
- Admin CSRF, session signing, escaping, and storage failure behavior.
- Mobile API validation, safe error messages, SecureStore recovery, hardware-key policy, and task cancellation.

**Mocking.** The Gemini tests use an httpx mock transport and do not call Google or require a key. That is the right approach for deterministic tests. The guidance research tests inject a fetcher and transport, which is also right. The storage layer has an in-memory implementation for unit tests and a PostgreSQL/Redis implementation for integration; the release notes say the real stores were exercised manually, but there is no automated integration test in the repository.

**Gaps.**

- No coverage measurement or threshold. There is no evidence of line or branch coverage in the repository.
- No CI, so the suites are not enforced on every change.
- No end-to-end Android test. The docs are explicit that camera, microphone, TalkBack, 200% text, hardware keys, and real remotes have not been verified on two physical phones.
- No load, soak, or concurrency test for the two-slot gate, Redis CAS, or PostgreSQL advisory locks.
- No dependency or secret scan in the test pipeline.
- The WebRTC demo tests are environment-sensitive and, per the docs, were sometimes run outside the sandbox.

**Verdict.** The suite design is thoughtful and targets the right risks. The missing piece is enforcement and reproducibility, not test intent.

---

## 8. Security and Vulnerability Posture

### 8.1 Controls that are working well

- **Authentication before parsing.** The v2 middleware identifies the bearer token before reading the body. The v3 middleware authenticates every `/api/v3` request, including GET and DELETE. Missing or malformed configuration fails closed.
- **Constant-time comparison.** Token digests are compared with `hmac.compare_digest` over the full list, with no early exit.
- **Bounded parsing.** Request bodies, multipart file counts, field counts, part sizes, image bytes, image dimensions, audio bytes, and audio duration are all capped. The image path rejects decompression bombs and verifies JPEG structure. The audio path rejects excess decoded samples before conversion.
- **Privacy.** The server does not persist image or audio bytes. Gemini requests set `store=false`. The mobile API health endpoint exposes only readiness booleans, not model paths, revisions, or upstream errors. Logs use stable error codes and timings.
- **Prompt-injection defense.** The guidance system prompt explicitly treats image text, user speech, web pages, and JSON fields as untrusted data, forbids following hidden instructions, distinguishes the remote from the target appliance, and requires evidence before advancing. The response is constrained by a strict JSON schema and validated field-by-field.
- **SSRF defense.** The document fetcher requires HTTPS, rejects credentials and non-443 ports, resolves the host once, requires every resolved address to be globally routable, pins the chosen IP while preserving SNI and the Host header, revalidates redirects, enforces an official-domain allowlist, caps document size, and strips script/style content.
- **Admin console.** The admin UI uses an HMAC-signed session cookie with `HttpOnly`, `SameSite=Strict`, a two-hour expiry, a CSRF token derived from the session, HTML escaping, a strict CSP, `nosniff`, and no OpenAPI surface. It is intended to run on loopback only.
- **Container.** The runtime image is multi-stage, runs as UID 10001, installs only the mobile requirements, disables the access log, and exposes a health check. No production secret is baked into the image.
- **Client.** The app stores the token in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, uses an abortable request with a fixed timeout, validates response shapes, maps errors to fixed messages, and avoids automatic retries when the state is ambiguous.

### 8.2 Findings

The detailed YAML records are in the frontmatter. This section summarizes the risk picture and the reasoning behind the severity choices.

| ID | Severity | Status | Finding | Why it matters |
|---|---|---|---|---|
| SEC-QODER-001 | MEDIUM | verified | Unauthenticated legacy WebRTC demo and media/export routes | Sensitive camera/audio export and single-session DoS if the demo is exposed |
| SEC-QODER-002 | MEDIUM | verified | Static, non-expiring trial tokens | A leaked token remains valid indefinitely; no attribution or selective revocation |
| SEC-QODER-003 | MEDIUM | verified | No per-token rate limit; v3 buffers before admission | One valid token can starve the other slot and burn quota; v3 uploads create pre-admission memory pressure |
| SEC-QODER-004 | MEDIUM | probable | Admin localhost guard trusts Host and peer | A local reverse proxy could expose knowledge approval; login is unthrottled |
| SEC-QODER-005 | MEDIUM | verified | No LICENSE; CC BY-NC-ND weights; visibility contradiction | No code grant; commercial and derivative use restricted; private/public claims conflict |
| SEC-QODER-006 | MEDIUM | verified | Model download is trust-on-first-use | A compromised upstream or first build can inject weights that the manifest then blesses |
| SEC-QODER-007 | MEDIUM | verified | Any HTTPS backend is accepted | A tricked user can send the trial token and camera/audio to an attacker |
| SEC-QODER-008 | LOW | verified | Absolute developer path in setup docs | Minor information disclosure and broken copy-paste onboarding |

No CRITICAL or HIGH finding survived evidence review. That is a meaningful result, not a clean bill of health: the system's boundary controls are strong, and the remaining risks are mostly lifecycle, abuse, and operational. A dynamic penetration test, a dependency audit, and a real-device privacy review could still change this picture.

### 8.3 Threat-model notes

- **The public surface is small.** The production app disables OpenAPI, redoc, and the access log. The only public routes are health, v2 analyze, v2 transcribe, and v3 assist/observation/operation/cancel. The demo and admin surfaces are separate.
- **The token is the security boundary.** Everything sensitive is behind the trial token. That makes token theft, token sharing, and token lifetime the highest-leverage risks. The current design treats a token as a long-lived shared secret.
- **The model is not trusted.** The guidance orchestrator does not accept model claims as verification; it requires a matching image view, a visible landmark, or an explicit user report, and it stops before sensitive confirmations. This is the right posture, but the residual risk of a plausible wrong instruction remains, especially for a blind user who cannot visually verify the model's claim.
- **The user is the weakest link in the client configuration path.** A blind user may rely on someone else to enter the server URL and token. The arbitrary-host behavior in SEC-QODER-007 is therefore more consequential than the same behavior would be in a conventional app.
- **The upstreams are trusted for availability and content.** Gemini and Hugging Face are single points of failure and integrity. The code handles Gemini errors well, but there is no secondary provider or cached fallback.

---

## 9. API and Interface Design

### 9.1 Inventory

| Method | Path | Auth | Input | Output |
|---|---|---|---|---|
| GET | `/api/health` | No | None | Readiness booleans, no secrets |
| POST | `/api/v2/analyze` | Bearer | Multipart: image + (audio or question) + client_turn_id + optional context | Transcript, answer, image feedback, latency, timings |
| POST | `/api/v2/transcribe` | Bearer | Multipart: audio + client_turn_id | Transcript, latency |
| POST | `/api/v3/assist` | Bearer | Multipart: transcript, client_request_id, frame_id, optional image | 202 operation reference |
| POST | `/api/v3/tasks/{task_id}/observations` | Bearer | Same as assist plus expected_revision | 202 operation reference |
| GET | `/api/v3/operations/{operation_id}` | Bearer | None | Operation status/result |
| DELETE | `/api/v3/tasks/{task_id}` | Bearer | Path task ID, or `current` plus client_request_id | Cancellation result |
| POST | `/api/webrtc/offer` | None | SDP JSON | Session ID and answer (demo only) |
| DELETE | `/api/sessions/{session_id}` | None | Path ID | Closed flag (demo only) |
| GET | `/api/sessions/{session_id}/turns/{turn_id}/image` | None | Path IDs | JPEG (demo only) |
| GET | `/api/sessions/{session_id}/turns/{turn_id}/audio` | None | Path IDs | WAV (demo only) |
| GET | `/api/sessions/{session_id}/turns/{turn_id}/export` | None | Path IDs | ZIP (demo only) |

The v3 routes are intentionally mobile-only; the admin application is not mounted on the mobile app. The admin console has its own HTML routes and is not part of the public API.

### 9.2 Contract quality

The API validates more than most pilots:

- Exact multipart field sets; duplicate fields are rejected.
- `client_turn_id` and task IDs are constrained by regex or length.
- Context is JSON with unique keys, at most three pairs, and a 4096-byte UTF-8 cap.
- Questions are 1–1000 characters and must survive UTF-8 encoding.
- Images must be JPEG, at most 2 MiB, and at most 1280 pixels on the long edge.
- Audio must be an accepted M4A/AAC MIME alias, at most 2 MiB, and at most 60 seconds after decode.
- v3 revisions are ASCII digits, at most six characters.
- Responses are validated on the client before use; the guidance decision is validated against a strict JSON schema on the server.

The v2 and v3 APIs use `TypedDict`/`GuidanceResult` and runtime checks rather than Pydantic request models. That is acceptable, but Pydantic models would give generated documentation and a more uniform validation story. OpenAPI is deliberately disabled, which is good for attack-surface reduction but bad for external integrators.

### 9.3 Error model

Errors are stable Vietnamese messages with fixed HTTP codes: 401 for missing/invalid token, 413 for oversized input, 422 for malformed or semantically invalid input, 429 for concurrency exhaustion, 502 for an invalid or refused upstream response, 503 for unready configuration or services, and 504 for timeout where applicable. The client maps server messages through an allowlist so an upstream error cannot be reflected verbatim. This is a good pattern.

A minor inconsistency: if `TRIAL_TOKEN_HASHES` is unset, v2 returns 503 ("service not ready"), while v3 returns 401 for every request because its middleware does not check `tokens.ready`. The operational outcome is safe in both cases, but the error contract is inconsistent. A single readiness check at the v3 layer would align them.

### 9.4 Media pipeline specification

- **Input video:** none. The app captures a still JPEG on demand. There is no continuous frame stream, no WebRTC video in the production app, and no server-side video decoding.
- **Input audio:** M4A/AAC from the phone, decoded with PyAV, resampled to mono 16 kHz, and streamed through Zipformer. The original audio is not sent to Gemini.
- **Output audio:** Android TTS on the device. There is no server-side speech synthesis.
- **Vision inference:** cloud Gemini Interactions API, image + text, strict JSON response schema, `store=false`.
- **Guidance state:** server-side task document in Redis or PostgreSQL, with revisions, pending actions, and owner locks; no media bytes.

This explicit separation is one of the repository's best architectural decisions. It should be stated in the root README, because a reader who starts with the WebRTC demo will otherwise assume the product streams continuous audio/video to a cloud model.

---

## 10. Data Management and Persistence

**PostgreSQL knowledge repository.** The migration creates knowledge profiles with lineage IDs, immutable versions, a unique `(lineage_id, version)` constraint, a GIN index for profile search, draft/approved/rejected/suspended states, and a trigger that prevents mutation of reviewed rows. `KnowledgeRepository` requires the database name `mat_kinh`, which prevents accidentally pointing the app at an unrelated database. Draft creation and updates run under PostgreSQL transaction advisory locks keyed by lineage, so two reviewers cannot create the same next version concurrently. `review` also takes an advisory lock before changing state. The immutability trigger and the version constraint together give a credible audit trail for guidance content.

**Redis task store.** Guidance tasks and operations are stored with a `matkinh:` prefix, idle and hard TTLs (600 s and 1800 s), owner locks, and a Lua compare-and-set script. The in-memory store mirrors the same interface for tests. The owner lock serializes task mutations per token identity, and the CAS prevents a stale revision from overwriting a newer one. The operation status path is designed so a cancelled request can leave a tombstone that a late worker cannot overwrite.

**What is not stored.** Image and audio bytes are not persisted. The task document stores goals, identity fields, pending action state, step counts, frame IDs, and image hashes, not media. Logs contain codes and timings, not transcripts or tokens. This is a strong privacy default for a camera application.

**Gaps.**

- There is a single migration (`001_guidance.sql`) and no documented down-migration or rollback procedure. The schema is small, but an operational rollback story is still missing.
- There is no retention policy for approved knowledge profiles, task documents, or operation records beyond the TTL. The TTL is appropriate for pilot tasks, but the knowledge repository needs an explicit archival policy.
- There is no backup, restore, or disaster-recovery procedure for PostgreSQL or Redis. The README says the pilot runs on a Mac; that makes data loss likely if the machine fails.
- The admin console and the mobile API share the same database configuration path. A compromised admin process could reach task data, and a misconfigured mobile deployment could reach draft knowledge. Separate roles or schemas would reduce blast radius.
- The database name check is a good guard, but there is no TLS or connection-authentication guidance for a hosted PostgreSQL instance.

**Verdict.** Thoughtful schema and concurrency design; operational data management is pilot-grade.

---

## 11. Performance and Concurrency

**Admission model.** `WorkGate(capacity=2)` allows two concurrent leases globally and at most one per token identity. There is no queue. A request that cannot acquire a lease receives 429 with `Retry-After: 2`. The production container runs one Uvicorn worker specifically so this in-process gate is global for the pilot. The code comments and docs acknowledge that multiple replicas would multiply the capacity and break the per-token guarantee.

**CPU isolation.** ASR, image validation, and audio decoding run through `asyncio.to_thread` and are shielded from request cancellation. A `WorkLease` tracks the worker task and a threading event. When the HTTP request is cancelled or disconnected, the lease sets the stop event, but the slot is not released until the worker actually finishes. This avoids the classic bug where a cancelled request frees a slot while the CPU thread is still running. The shared Zipformer recognizer has its own inference lock, so concurrent streams cannot corrupt decoder state.

**Latency evidence.** The documentation records ASR in the 59–175 ms range and Gemini in roughly 5.8–10.0 seconds for synthetic tests. The end-to-end target is under 10 seconds from button press to speech start, measured separately for cold and warm turns. The docs correctly state that this target has not been proven on real phones or mobile networks. The 0.4.0 notes record 6.3 s and 7.1 s Gemini turns, and explicitly say that is not enough evidence for the median target.

**Bottlenecks.**

- Gemini network latency dominates. The code has one request path and no streaming or speculative fallback. A provider outage becomes a user-visible failure after the timeout.
- Model load takes about 1.7 seconds in the recorded smoke test and happens at startup, not per request. That is the right choice.
- JPEG encode/decode and the 1280-pixel limit add CPU work but are bounded.
- PostgreSQL and Redis add per-turn round trips in v3. The owner lock and CAS are correct but may serialize a single user's rapid observations.
- The v3 path buffers the full upload before acquiring the guidance lease (SEC-QODER-003), which is a pre-admission cost that the v2 path avoids.

**Scalability.** The gate is intentionally single-process. Horizontal scaling would require a shared admission mechanism (Redis lease tokens or a queue) and a shared rate limiter. The current design is appropriate for a two-user pilot and inappropriate for a larger trial. That is a documented limitation, not a hidden defect, but it should be an explicit gate before increasing capacity.

**Verdict.** The concurrency model is careful and correct for its intended scale. The main performance risk is upstream latency, not local CPU.

---

## 12. Deployment and Operations

**Container role.** The Dockerfile builds two stages. The model stage installs `huggingface_hub` and `python-dotenv`, copies `model_config.json` and the download script, downloads the four pinned files to `/opt/zipformer`, and removes the cache. The runtime stage installs `requirements-mobile.txt`, copies `app/`, `migrations/`, the migration script, and the model, creates UID 10001, exposes port 8080, and starts one Uvicorn worker for `app.mobile_api:app` with the access log disabled. The health check calls `/api/health` on loopback. This is a sensible production image for the server role.

**What the image does not contain.** It does not contain the mobile APK, the desktop web assets, the tests, the development requirements, or the admin console process. It does contain the demo Python modules because `COPY app/ app/` is broad. The demo cannot run in the image without `aiortc`, but its source is present. That is the packaging nuance behind SEC-QODER-001.

**Host deployment.** `scripts/run_mobile.sh` binds the mobile API to `127.0.0.1:8080` and expects a local virtual environment. `scripts/run_guidance_admin.sh` binds the admin console to `127.0.0.1:8081`. `scripts/create_trial_token.py` generates a token, writes its hash to `.env`, and writes the plaintext token to a mode-600 file. `scripts/migrate_guidance.py` applies the migration. These are practical pilot scripts, but they assume a Mac/Linux host with Python 3.11, PostgreSQL, and Redis.

**Public exposure.** The release notes use a Cloudflare Quick Tunnel URL for the mobile backend. Quick Tunnel URLs are ephemeral and change when the tunnel restarts; the docs acknowledge this. `docs/ANDROID_SETUP.md` provides a Cloud Run reference command with `--allow-unauthenticated` at the Cloud Run layer and a Bearer token at the application layer, plus a one-instance/one-worker constraint. That is a coherent design, but the command uses a sample project, region, repository, and an old image tag (`0.1.0`), so it is not a reproducible deployment manifest.

**Observability.** Logs are deliberately minimal: error codes and timings, no media, no transcript, no token. That is good privacy hygiene, but there are no metrics, traces, dashboards, or alerts. There is no visibility into 429 rates, per-token usage, Gemini latency percentiles, ASR failures, or storage errors. For a pilot with blind users, operational blindness is a real risk: a silent degradation could leave a user without assistance.

**CI/CD and release engineering.** There is no CI/CD. The APK is built through EAS and distributed by artifact link. The source release is a manually assembled ZIP. The repository has one tag (`v0.1.0`) despite release notes through 0.4.0. The APK is not signed by a reproducible release pipeline in the repository. These are normal for a pilot but should be resolved before a public or commercial release.

**Verdict.** The container is well built; the operational envelope around it is manual, single-host, and under-instrumented.

---

## 13. Documentation and Onboarding Integrity

**Strengths.** The documentation is unusually honest. It records what was tested, what failed, which model was used, what was not verified on physical devices, and where the pilot's limits are. The architecture document explains the media and privacy model. The release notes include concrete latency numbers and known failures. The guidance document explains the approval workflow and the research gate. This honesty is valuable and should be preserved.

**Front-door defects.**

1. **Wrong first impression.** The root README leads with the desktop WebRTC demo. A new reader can easily conclude that the product is a browser application that streams camera and microphone to a local server. The actual product is an Android app that sends discrete snapshots to a token-protected mobile API. The README mentions `app.mobile_api:app` only in a warning not to expose `app.main:app`, not as the primary onboarding path.
2. **Aspirational hardware presented as product context.** The "LIDAR sensor ST Electronics VL53L9CX" section includes a product link, resolution claims, and an image, but no integration code. The text does say software has to analyze it, and the Git history confirms it was added as a future-work note. Still, placing it between the license and screenshots invites readers to assume it is part of the current system.
3. **Author uncertainty in the front door.** The screenshot section says the author is not sure why a Gemini token is needed or what versions 0.2.1, 0.3, and 0.4 did. That is a candid historical note, but it belongs in a changelog or a "known confusion" section, not in the primary README.
4. **Version delta is scattered.** The 0.2.0, 0.2.1, 0.3.0, and 0.4.0 deltas are described in `docs/IMPLEMENTATION_STATUS.md` and separate release documents. There is no single capability matrix. A reader cannot quickly answer "what does 0.4.0 add over 0.3.0?" without reading several files.
5. **Stale local paths.** `docs/ANDROID_SETUP.md` hard-codes a developer's home directory in four commands (SEC-QODER-008).
6. **Ephemeral deployment links.** The 0.4.0 release note gives a Quick Tunnel URL and an EAS artifact link. The tunnel URL will expire; the APK link may be revoked. Neither is a stable onboarding path.
7. **Historical test counts without a command.** The implementation status records 143, 216, 270, and 322 Python tests and 100, 176, 270, and 329 mobile tests across different dates. These are useful history, but there is no single command and environment description that reproduces the current count.
8. **Private/public contradiction.** The README says the repository is private; the release note publishes a public archive link. This is both a documentation defect and a licensing risk (SEC-QODER-005).

**Onboarding friction score: high.** The code is easier to understand than the documentation suggests. A reader who starts in `app/mobile_api.py`, `app/mobile_security.py`, `app/mobile_pipeline.py`, and `mobile/src/services/api.ts` will build a correct mental model quickly. A reader who starts at the README may not.

**Recommended front door.** Replace the root README with three explicit tracks:

- **Use the Android app:** prerequisites, server URL, token, permissions, hardware keys, TalkBack, and known device limitations.
- **Run the backend:** `app.mobile_api:app`, PostgreSQL/Redis, model download, token creation, migration, health check, and the one-worker constraint.
- **Review guidance knowledge:** `app.guidance_admin:app`, loopback binding, admin token, approval workflow, and the research gate.

Then add a capability matrix, a version table, a tested/untested matrix, a clear "this is a phone app, not glasses" statement, and a "LIDAR is future work" note. Move the author's historical uncertainty to a changelog. Remove absolute paths and ephemeral links from setup instructions.

---

## 14. Development Activity and Maturity

The snapshot has five commits and one tag (`v0.1.0`). The latest commit is README-only and adds license and LIDAR notes. The documentation records a compressed release cadence: 0.1.x in early October, 0.2.0/0.2.1 in mid-October, 0.3.0 on 15 October, and 0.4.0 by late October. That is rapid iteration by a small team, with release notes written close to the work.

**Active maintenance index: active but small.** The code and docs are recent, the release notes are detailed, and the author responds to failures in the documentation (for example, the Android 15, upload, and MIME fixes). The absence of CI, tags for 0.2–0.4, and automated dependency updates means the project relies on manual discipline. Contributor diversity and issue velocity cannot be assessed offline; the Git shortlog shows a small set of names and the repository has no issue templates or contribution guide.

**Maturity verdict: prototype moving toward pilot.** The engineering quality is above the usual prototype level, but release engineering, support, and operational maturity are still pilot-grade.

---

## 15. Licensing and Legal Compliance

| Asset | License / status | Implication |
|---|---|---|
| Repository code | No LICENSE, COPYING, or NOTICE | Default copyright; no grant to copy, modify, or distribute |
| Zipformer weights | CC BY-NC-ND 4.0 per the model card cited in README | No commercial use; no distribution of derivatives; attribution required |
| sherpa-onnx runtime | Apache-2.0 per README | Permissive, but does not relicense the weights |
| Python dependencies | Mixed permissive licenses (not audited in this review) | Requires an SBOM and license review before distribution |
| Mobile dependencies | Mixed permissive licenses (not audited in this review) | Requires an SBOM and license review before distribution |
| Documentation and images | No explicit license | Default copyright applies |
| Repository visibility | README says private; release notes link a public archive | Contradictory; must be resolved |

**Commercial feasibility.** Blocked as currently licensed. The code has no grant at all, and the model weights are non-commercial and no-derivatives. A commercial pilot would need a code license from the author and either a different ASR model or an explicit commercial license for the current weights. A research or non-commercial pilot still needs a code license to clarify contribution and distribution rights.

**Recommendation.** Add a root LICENSE (Apache-2.0 is a reasonable default for a FastAPI/Expo project), a NOTICE that records the model and runtime licenses separately, and SPDX headers. Add a third-party license inventory generated from the lockfiles. State visibility accurately. If the project intends to remain non-commercial, say so explicitly and document the consequences for pilot deployments.

---

## 16. Prioritized Roadmap

### Next 30 days

1. **Fix the front door.** Rewrite the root README around the three tracks, state "phone app, not glasses," mark LIDAR as future work, add the version table, and remove absolute paths and ephemeral links. This is the highest-leverage change for reviewers, operators, and contributors.
2. **Add a LICENSE and NOTICE.** Separate code, model weights, and runtime licenses. Resolve the private/public contradiction.
3. **Close the token lifecycle gap.** Add expiry, revocation, owner labels, and last-used timestamps. Even a small PostgreSQL table is enough; keep the constant-time comparison and fail-closed behavior.
4. **Add rate limits and quotas.** Token bucket per identity and per IP, daily Gemini budget, 429 with Retry-After, and alerting on abuse signals. Move the v3 body read behind an admission lease.
5. **Remove the demo from the production package.** Exclude `app/main.py`, `app/session.py`, and `web/` from the runtime image, or gate them behind `DEMO_MODE` plus authentication. Add a test that the production app exposes no demo routes.
6. **Pin model hashes.** Put expected SHA-256 values in `model_config.json`, verify before use, and fail closed. Add `--require-hashes` for pip in the image build.
7. **Add CI.** Run Python tests, Jest, TypeScript, compileall, secret scanning, `pip-audit`, and `npm audit` on every change. Add a coverage report, even if the threshold starts low.

### Next 60 days

1. **Harden the admin console.** Require the admin secret on every state-changing request, add login throttling and idle timeout, ignore Host for authorization, and document the no-proxy invariant. Consider a Unix socket or a dedicated loopback port with firewall rules.
2. **Add a backend allowlist to the mobile client.** Pin the pilot host or a signed allowlist, require spoken and visual confirmation on host change, and consider certificate pinning for production.
3. **Add observability.** Metrics for request rate, 429/401/5xx, ASR latency, Gemini latency percentiles, per-token usage, storage errors, and task completion. Add a small dashboard and alert thresholds. Keep the no-media logging rule.
4. **Run a load and soak test.** Exercise the two-slot gate, Redis CAS, PostgreSQL advisory locks, cancellation, and reconnection. Document the capacity ceiling and the behavior when Gemini is slow or unavailable.
5. **Complete device acceptance.** Test on at least two physical Android phones: camera, microphone, TalkBack, 200% text, hardware keys, background/foreground transitions, Wi-Fi/4G, and 20-turn sessions. Record the results against the existing checklist.
6. **Add PostgreSQL/Redis integration tests.** Automate the manual storage checks described in the release notes. Add a migration rollback or a documented restore procedure.
7. **Add an SBOM and a dependency update policy.** Generate an SBOM from the lockfiles, review licenses and CVEs, and define a patch cadence.

### Next 90 days

1. **Resolve the model license.** Replace the CC BY-NC-ND weights with a permissively licensed ASR model, or obtain a commercial license. Re-run the accuracy and latency evaluation on the replacement.
2. **Harden release engineering.** Tag every release, sign APKs reproducibly, publish checksums, and produce a reproducible backend image (digest-pinned base, hash-pinned dependencies). Replace manual ZIP assembly with a CI artifact.
3. **Add a privacy and safety review.** Document the data flow for camera and audio, the retention policy, the third-party processors (Gemini, Brave, Hugging Face), and the failure modes for blind users. Consider a small usability study with the target user group.
4. **Add distributed admission if scaling.** If the pilot grows beyond one process, move the gate and quotas to Redis or a queue with fairness. Until then, keep the one-worker constraint explicit and enforced.
5. **Commission an external penetration test.** Focus on the mobile API, the admin console, the document fetcher, prompt injection, and the client's server-configuration path.

---

## Appendix A: Verification Method and Limitations

**What was inspected.** The review used the deterministic analyzer output in `target-metrics.json`, direct reading of the source and documentation, static test inventory, Git history, dependency manifests, schema and migration files, and targeted searches for secrets, absolute paths, CI configuration, and hardware references. No code in `review1` was evaluated as target code.

**What was not executed.** The Python test suite, the Jest suite, the TypeScript compiler, the Docker build, and the analyzer's dynamic checks were not run against the target in this environment. The target's Python virtual environment and `mobile/node_modules` are absent, and PostgreSQL/Redis are not running. The deterministic metrics were generated by the harness analyzer; the test counts in this report are static counts. No live Gemini, Hugging Face, Brave, or Database calls were made. No dynamic exploit was attempted. The security findings are based on code and configuration evidence, not on exploitation.

**Calibration.** The analyzer reported five preliminary "Hardcoded Credentials" flags, all in test modules. Inspection shows fixture values used to exercise token parsing and error paths, not production secrets. I did not promote those flags into findings. Conversely, the absence of a CRITICAL or HIGH finding is not proof of absence; it reflects the evidence available in a static review.

**Boundary.** The target is the external repository in `target/APEC_mat_kinh_cho_nguoi_khiem_thi`. The review harness, its dashboard, its scripts, and its own documentation are out of scope. The report does not fabricate results for any model that was not run.
