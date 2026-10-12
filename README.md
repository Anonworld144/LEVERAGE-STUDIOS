# LEVERAGE-STUDIOS: Local-First AI Agent Coding Studio

> An open-source, local-first AI agent desktop studio built with Tauri 2.0, React 19, and TypeScript. Features multi-agent DAG orchestration and Bring Your Own Key (BYOK) local security.

[![CI/CD Release](https://github.com/leverage-studios/leverage-studios/actions/workflows/build-release.yml/badge.svg)](https://github.com/leverage-studios/leverage-studios/actions)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Platform: Windows & Linux](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-brightgreen.svg)]()
[![Tauri: 2.0](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://tauri.app/)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-blue.svg)](https://microsoft.github.io/monaco-editor/)
[![Privacy: BYOK Local-First](https://img.shields.io/badge/Privacy-100%25%20Local%20BYOK-success.svg)]()

---

## 🔒 Bring Your Own Key (BYOK) Privacy Architecture

Unlike traditional AI coding assistants that route your proprietary code, prompts, and credentials through third-party cloud intermediaries, **Leverage Studios operates on a strict local-first, zero-egress BYOK model**:

- **Local Secret Storage**: All API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are stored strictly on your local machine using client-side secure storage.
- **Direct Model Connections**: The desktop client communicates **directly and point-to-point** with your chosen AI provider endpoints (Google Gemini, OpenAI, Anthropic). No intermediary servers ever receive, inspect, or log your keys or source code.
- **Audited Sandboxing**: Agent execution contexts are strictly isolated from system environment variables; ambient OS secrets are never leaked to tool runners or plugin handlers.

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
│   │   • BYOK Settings Modal with Connection Verification              │   │
│   └─────────────────┬───────────────────────────────▲─────────────────┘   │
│                     │ Typed IPC                     │ Events & Telemetry  │
│                     ▼                               │                     │
│   ┌─────────────────────────────────────────────────┴─────────────────┐   │
│   │                 DESKTOP BACKEND (Tauri 2.0 Rust Core)             │   │
│   │   • Native Window Management (Windows .msi / Linux .AppImage)     │   │
│   │   • Process Supervisor (Python & Node.js Subprocess Workers)      │   │
│   │   • Extism / Wasmtime Sandboxed Plugin Execution Engine           │   │
│   └─────────────────┬─────────────────────────────────────────────────┘   │
│                     │                                                     │
│   ┌─────────────────▼─────────────────┐   ┌───────────────────────────┐   │
│   │        LOCAL SECURE STORE         │   │     WASM PLUGIN RUNNER    │   │
│   │   • GEMINI_API_KEY                │   │   • Linear Memory Bounds  │   │
│   │   • OPENAI_API_KEY                │   │   • Gas Instruction Meter │   │
│   │   • ANTHROPIC_API_KEY             │   │   • Zero-Trust Scopes     │   │
│   └─────────────────┬─────────────────┘   └───────────────────────────┘   │
│                     │                                                     │
└─────────────────────┼─────────────────────────────────────────────────────┘
                      │ Direct, TLS-Encrypted Egress (No Proxy)
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

| Feature | Capability | Description |
| :--- | :--- | :--- |
| **BYOK Security** | 100% Local-First | Client-managed keys, zero telemetry proxy, password visibility toggles, and live connection verification. |
| **Multi-Agent DAG** | Topological Orchestration | Visual node graph chaining specialized agents (*Architect, Coder, Reviewer, Security Auditor, Debugger*) with clean error isolation. |
| **Streaming Diff Previews** | Real-Time Unified Hunks | Monaco-powered side-by-side diff previews with one-click Accept/Reject patch controls. |
| **WASM Plugin Sandbox** | 1,000+ Dynamic Plugins | Extism/Wasmtime sandboxing with 16MB–64MB memory caps, instruction gas metering, and capability permission auditing. |
| **AST Code Parsing** | Multi-Language Analysis | Structural analysis for TypeScript, JavaScript, Rust, and Python to extract symbols, classes, and calculate complexity scores. |
| **Cross-Platform Native Shell** | Windows & Linux | Lightweight Tauri 2.0 binary with minimal memory footprint compared to Electron. |

---

## 🏗️ Monorepo Layout

Managed via `pnpm` workspaces:

```
leverage-studios/
├── apps/
│   ├── studio/                 # Tauri 2.0 + React desktop IDE UI
│   └── docs/                   # Developer documentation & interactive WASM testbed
├── packages/
│   ├── core/                   # BaseAgent, AgentManager, SettingsStore, ASTParser, DiffEngine
│   └── plugin-sdk/             # WASM sandbox runner (Extism/Wasmtime), plugin registry, security audit
├── src-tauri/                  # Rust 2.0 desktop shell, IPC commands, and native WASM execution
├── .github/workflows/
│   └── build-release.yml       # Windows (.msi) and Linux (.AppImage/.deb) matrix build
└── pnpm-workspace.yaml
```

---

## 📋 System Requirements

### Hardware
- **CPU:** 64-bit Dual-Core x86_64 processor (Quad-Core recommended).
- **RAM:** Minimum 4 GB RAM (8 GB recommended for compiling Rust & running multi-agent workflows).
- **Disk:** 500 MB free space for the compiled binary (2 GB during build with Rust toolchain).

### Software Toolchains
- **Node.js:** `>= 20.x LTS`
- **pnpm:** `>= 9.x`
- **Rust Toolchain:** `>= 1.80.0 Stable` (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **WASM Target:** `rustup target add wasm32-wasip1`

#### Linux System Packages (Ubuntu / Debian)
```bash
sudo apt-get update && sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libgtk-3-dev \
  squashfs-tools
```

#### Windows Prerequisites
- **Visual Studio C++ Build Tools** (Select "Desktop development with C++")
- **Microsoft Edge WebView2 Runtime** (Standard on Windows 10/11)

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

### 3. Run in Web Development Mode (Fast UI & Agent Testing)
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run the Full Desktop Application (Tauri 2.0 + Rust Engine)
```bash
pnpm tauri dev
```

### 5. Configure Your API Key
1. Click the **Settings (⚙️)** button in the top navbar.
2. Enter your **Google Gemini**, **OpenAI**, or **Anthropic** API key.
3. Click **Test Connection** to verify validity.
4. Click **Save Settings**. Your agents will now execute live code generation directly!

---

## 📦 Building Production Release Binaries

```bash
# Builds optimized web assets and native Tauri installer packages
pnpm tauri build
```

Generated bundles will be placed in:
- **Windows:** `src-tauri/target/release/bundle/msi/*.msi` and `.../nsis/*.exe`
- **Linux:** `src-tauri/target/release/bundle/appimage/*.AppImage` and `.../deb/*.deb`

---

## 📄 License

Leverage Studios is open-source software licensed under the [Apache License 2.0](LICENSE).
