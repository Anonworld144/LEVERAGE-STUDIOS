## SECURITY & RELEASE CHECKLIST (IMPORTANT)

This section documents critical security considerations and a hardening checklist you MUST follow before publishing releases or claiming BYOK/sandbox guarantees. Leverage Studios is a developer-preview prototype — the defaults are intentionally permissive for local development.

### Short summary
- The project implements a BYOK model and an LLM proxy, but by default the server may accept client-supplied API keys only when explicitly enabled. Accepting per-request keys without authentication is unsafe and may expose your server to abuse.
- LLM outputs are nondeterministic; the proxy attempts to coerce and parse machine-readable JSON diffs, but you MUST add tests and monitoring for parse failures to avoid writing malformed or unsafe code to disk.
- The iframe sandbox is hardened but still includes inline script usage in development. For production, serve it with strict CSP headers and remove `unsafe-inline`/`unsafe-eval` where possible.

### Critical warnings (Do NOT ship without addressing these)
- Do NOT enable ALLOW_CLIENT_API_KEYS in production unless you implement authenticated user accounts, secure server-side key storage, per-user quotas, and auditing.
- Do NOT rely on sessionStorage/IndexedDB alone for secret storage on desktop — prefer OS-native keystores (Keychain, DPAPI, Secret Service) when packaging via Tauri.
- Do NOT accept raw LLM output as authoritative. Always parse and validate JSON diffs server-side, and add post-parse validation checks (syntax, type checks) before applying edits.

### Minimum hardening checklist (complete before public release)
- [ ] Choose a key model and implement it fully:
  - Option A (recommended initially): Server-only keys
    - Set GEMINI_API_KEY (and others) in your server environment.
    - Disable ALLOW_CLIENT_API_KEYS (default false).
    - Update UI to only use `check_config` for key verification.
  - Option B: Authenticated BYOK
    - Implement user authentication.
    - Accept client keys only during an authenticated onboarding flow.
    - Store encrypted keys server-side or use ephemeral token exchanges.
    - Enforce per-account rate limits and logging.

- [ ] Use a production-grade rate limiter (express-rate-limit or Redis-backed) and monitor for abnormal traffic.
- [ ] Enforce strict CORS allowlist and always serve via HTTPS with HSTS.
- [ ] Serve `public/sandbox-runner.html` with strict CSP HTTP headers; remove `unsafe-inline`/`unsafe-eval` where possible and use nonces.
- [ ] Validate `postMessage` origin on both host and guest sides; implement a message schema and (optionally) HMAC verification for high-security deployments.
- [ ] Migrate desktop key storage to the OS keystore via Tauri secure APIs.
- [ ] Add automated tests and CI checks:
  - unit tests for server parse/parseDiffs and proxy behavior (mock provider)
  - unit tests for secureKeyManager encryption/decryption
  - integration tests for agent.executeTask -> diffs flow
  - sandbox message roundtrip tests
- [ ] Add dependency audits and enable Dependabot/Renovate.
- [ ] Configure CI to use secret stores and ensure secrets are never printed in logs.
- [ ] Add logging/monitoring/alerts for parsing failures, failed proxy attempts, and potential abuse.
- [ ] Conduct a security review / penetration test focusing on postMessage abuse, local storage hardening, and proxy abuse scenarios.

### Local validation commands (developer)
```bash
pnpm install
pnpm lint        # Typecheck via tsc --noEmit
GEMINI_API_KEY=yourkey pnpm dev
# Test proxy config check
curl -X POST http://localhost:3000/api/agent/run -H 'Content-Type: application/json' -d '{"action":"check_config"}'
```

### Developer FAQs (quick)
- Q: Can I run the app without a server key? A: Yes for local testing, but features that call the server proxy will be limited. For full BYOK + generation, set `GEMINI_API_KEY` or implement authenticated BYOK.
- Q: Why not store keys in localStorage? A: Plaintext storage is trivially exfiltrable by XSS or local malicious code. Use Web Crypto + OS keystore for desktop.
- Q: What does the proxy return? A: The proxy attempts to return a structured `{ diffs: [{ filePath, modifiedContent }] }` array. Always validate before applying.

---

Please follow the checklist above before shipping a public release. If you'd like, I can open follow-up PRs to:
- convert SettingsModal.test to use `check_config` when server keys are used,
- replace the in-memory rate limiter with `express-rate-limit`,
- add a basic Jest suite for server parsing and core agent flows.

