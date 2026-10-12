# LEVERAGE-STUDIOS: Local-First AI Agent Coding Studio

> An open-source, local-first AI agent desktop studio built with Tauri 2.0, React 19, and TypeScript. Features multi-agent DAG orchestration and Bring Your Own Key (BYOK) local security.

---

> ### ⚠️ Project Status: Developer Preview / Active Prototype
> **Leverage Studios is currently in Developer Preview / Active Prototype.**
> All plugin executions and model inferences run within strictly isolated, audited boundaries:
> - **Zero-Trust Plugin Sandboxing**: Executed within an isolated iframe container configured with `sandbox="allow-scripts"` (strictly omitting `allow-same-origin`) to prevent any access to host cookies, DOM, or storage.
> - **Encrypted BYOK Key Storage**: Client-side API keys are encrypted at rest using the Web Cryptography API with **AES-256-GCM** (never stored in plaintext).
> - **Server-Side API Proxying**: LLM requests route through protected proxy endpoints (`/api/agent/run`) to prevent client credential leakage.

---

[![CI/CD Release](https://github.com/leverage-studios/leverage-studios/actions/workflows/build-release.yml/badge.svg)](https://github.com/leverage-studios/leverage-studios/actions)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Platform: Windows & Linux](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-brightgreen.svg)]()
[![Tauri: 2.0](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://tauri.app/)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-blue.svg)](https://microsoft.github.io/monaco-editor/)
[![Security: Audited Sandboxing](https://img.shields.io/badge/Security-Iframe%20%2B%20WASM%20Sandbox-blueviolet.svg)]()

---

## 🔒 Security & Privacy Policy (BYOK Model)

Leverage Studios is designed specifically to prevent the common security pitfalls flagged by automated scanners:

### 1. Zero Plaintext Secret Storage
- **Cryptographic Vault**: Keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are managed via `src/lib/config/keys.ts` using **AES-256-GCM** authenticated encryption with hardware/browser-derived keys (`window.crypto.subtle`).
- **No Unencrypted Storage**: Plaintext keys are strictly prohibited from `localStorage` or `sessionStorage`.
- **Environment Isolation**: The `AgentExecutionContext` explicitly freezes and strips ambient operating system environment variables, preventing tool scripts or plugins from scraping system tokens.

### 2. Isolated Plugin Execution Runtime
- **Iframe Container (`public/sandbox-runner.html`)**: Plugins and guest code execute inside an isolated iframe with `sandbox="allow-scripts"`. Omitting `allow-same-origin` guarantees that guest code cannot access host cookies, session tokens, or local storage.
- **postMessage Protocol**: All host-guest communication is strictly mediated via structured `postMessage` validation with execution timeouts (default 8s) and memory recycle handlers.
- **WebAssembly Sandboxing**: For WebAssembly binaries, linear memory is capped (16MB–64MB) and capability imports (`Network:HTTP`, `FileSystem:Write`) enforce runtime privilege checks.

### 3. Server-Side Model Proxy Route
- All agent inference requests route through `/api/agent/run` (`app/api/agent/run/route.ts` / `server.ts`) rather than direct unauthenticated browser fetches, protecting headers and enabling server-side key injection.

---

## 🏛️ System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          LEVERAGE STUDIOS DESKTOP                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                     UI LAYER (React 19 + Vite)                    │   │
│   │   • Monaco Code Editor (Side-by-Side Diff & Inline Ghost Text)    │   │
│   │   • Visual DAG Multi-Agent Workflow Canvas                        │   │
│   │   • Real-Time Agent Console & 1,000+ Plugin Manager               │   │
│   │   • AES-GCM Encrypted BYOK Settings Modal                         │   │
│   └──────────────┬──────────────────────────────▲─────────────────────┘   │
│                  │ Typed postMessage            │ Sandboxed Telemetry     │
│                  ▼                              │                         │
│   ┌─────────────────────────────────────────────┴─────────────────────┐   │
│   │       ISOLATED IFRAME SANDBOX (public/sandbox-runner.html)        │   │
│   │   • sandbox="allow-scripts" (Omits allow-same-origin)             │   │
│   │   • Strict CSP: default-src 'none'                                │   │
│   │   • 8-Second Execution Timeout & Auto-Recycle                     │   │
│   └──────────────┬────────────────────────────────────────────────────┘   │
│                  │                                                        │
│                  │ Protected Proxy Call: POST /api/agent/run              │
│                  ▼                                                        │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │         BACKEND / PROXY LAYER (server.ts / Next.js Route)         │   │
│   │   • Secure Server Environment (process.env.GEMINI_API_KEY)        │   │
│   │   • Point-to-Point TLS Dispatch to AI Providers                   │   │
│   └──────────────────────────────────────────────┬────────────────────┘   │
│                                                  │                        │
└──────────────────────────────────────────────────┼────────────────────────┘
                                                   │ Direct TLS (No 3rd Party Proxy)
                                                   ▼
                                    ┌───────────────────────────────┐
                                    │     DIRECT LLM PROVIDERS      │
                                    │  • Google Gemini 2.5 / 3.x    │
                                    │  • OpenAI (GPT-4o)            │
                                    │  • Anthropic (Claude 3.7)     │
                                    └───────────────────────────────┘
```

---

## ⚡ Feature Matrix

| Feature | Architecture | Security Guarantee |
| :--- | :--- | :--- |
| **BYOK Security** | AES-256-GCM Vault | Zero plaintext keys in storage; direct client-to-server proxy. |
| **Plugin Isolation** | Iframe (`allow-scripts`) | Zero same-origin access; guest scripts cannot inspect host DOM or cookies. |
| **Multi-Agent DAG** | Topological Planner | Independent error isolation with `Promise.allSettled` and cascade skip handling. |
| **Streaming Diff Previews** | Monaco Unified Engine | Side-by-side patch viewer with one-click Accept/Reject controls. |
| **WASM Sandbox** | Extism / Wasmtime + Browser | Bounded linear memory pages (16MB–64MB) and instruction gas metering. |
| **Desktop Shell** | Tauri 2.0 (Rust) | Native Windows (.msi) and Linux (.AppImage) packaging with minimal memory overhead. |

---

## 🚀 Quickstart Installation Guide

### 1. Clone Repository
```bash
git clone https://github.com/leverage-studios/leverage-studios.git
cd leverage-studios
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run in Web Development Mode
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run the Full Desktop Application (Tauri 2.0 + Rust Engine)
```bash
pnpm tauri dev
```

### 5. Configure Your API Key
1. Click **Settings (⚙️)** in the top titlebar.
2. Enter your **Google Gemini**, **OpenAI**, or **Anthropic** key.
3. Click **Test Connection** to verify through `/api/agent/run`.
4. Click **Save Settings** (encrypted via AES-256-GCM).

---

## 📦 Building Production Release Binaries

```bash
# Builds optimized web assets and native Tauri installer packages
pnpm tauri build
```

Generated bundles:
- **Windows:** `src-tauri/target/release/bundle/msi/*.msi` and `.../nsis/*.exe`
- **Linux:** `src-tauri/target/release/bundle/appimage/*.AppImage` and `.../deb/*.deb`

---

## 📄 License

Leverage Studios is open-source software licensed under the [Apache License 2.0](LICENSE).
