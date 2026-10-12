# Leverage Studios

> A lightweight, open-source, AI-native desktop coding studio designed for agent-assisted coding, multi-agent orchestration, and a high-scale 1,000+ WebAssembly plugin ecosystem.

[![CI/CD Release](https://github.com/leverage-studios/leverage-studios/actions/workflows/build-release.yml/badge.svg)](https://github.com/leverage-studios/leverage-studios/actions)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Platform: Windows & Linux](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-brightgreen.svg)]()
[![Tauri: 2.0](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://tauri.app/)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-blue.svg)](https://microsoft.github.io/monaco-editor/)

---

## 📌 Project Overview

**Leverage Studios** is an AI-first IDE built from the ground up for collaborative multi-agent workflows and high-concurrency plugin execution. Instead of treating AI as a chat sidebar, Leverage Studios treats agents as first-class asynchronous pipeline workers that communicate over typed IPC, synthesize code into streaming diffs, and execute tools within isolated WebAssembly sandboxes.

### Key Highlights
- **Cross-Platform Desktop Shell**: Built with **Tauri 2.0 (Rust)** + **React 19 (TypeScript)** + **Vite 8** for minimal memory footprint and fast startup.
- **Embedded Monaco Editor**: Full Monaco code editor integration (`@monaco-editor/react`) featuring unified and side-by-side streaming diff reviews, syntax verification, and inline ghost-text AI autocomplete.
- **Multi-Agent DAG Orchestrator**: Directed Acyclic Graph (DAG) workflow engine allowing specialized agents (*Architect, Coder, Reviewer, Security Auditor, Debugger*) to run in dependency order with real-time progress.
- **1,000+ WASM Plugin Ecosystem**: Extism- and Wasmtime-powered sandboxed execution with linear memory caps (16MB–64MB), instruction gas metering, and zero-trust capability permissions (`FileSystem:WorkspaceOnly`, `Network:HTTP`, `ProcessExecution:CLI`).
- **Cross-Platform IPC Bridge**: Bidirectional communication channels connecting the Rust core with Node.js worker pools and Python agent environments.

---

## 🏗️ Monorepo Architecture

Managed via `pnpm` workspaces:

```
leverage-studios/
├── apps/
│   ├── studio/                 # Main Tauri + React desktop UI
│   └── docs/                   # Developer documentation & interactive WASM testbed
├── packages/
│   ├── core/                   # Agent runtime, BaseAgent, DAG planner, AST parser, DiffEngine
│   └── plugin-sdk/             # WASM sandbox runner (Extism/Wasmtime), plugin registry, security audit
├── src-tauri/                  # Rust 2.0 desktop shell, IPC commands, and native WASM execution
├── .github/workflows/
│   └── build-release.yml       # Windows (.exe/.msi) and Linux (.AppImage/.deb) matrix build
└── pnpm-workspace.yaml
```

---

## 📋 System Requirements

### Hardware Requirements
- **CPU**: 64-bit Dual-Core x86_64 processor (Quad-Core recommended).
- **RAM**: Minimum 4 GB RAM (8 GB recommended for compiling Rust & running multi-agent workflows).
- **Disk**: 500 MB free space for the compiled binary (2 GB during build with Rust toolchain).

### Software & Toolchain Prerequisites

| Dependency | Minimum Version | Installation / Notes |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.x LTS` | [nodejs.org](https://nodejs.org/) |
| **pnpm** | `>= 9.x` | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Rust Toolchain** | `>= 1.80.0 Stable` | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Rust WASM Target** | `wasm32-wasip1` | Required for compiling plugins: `rustup target add wasm32-wasip1` |

#### Linux-Specific System Libraries (Ubuntu / Debian)
Tauri 2.0 on Linux requires WebKit and GTK 3 development headers:
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

#### Windows-Specific Prerequisites
- **Microsoft C++ Build Tools** (via [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/)): Select "Desktop development with C++".
- **WebView2**: Pre-installed on Windows 10 and 11.

---

## 🚀 Installation & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/leverage-studios/leverage-studios.git
cd leverage-studios
```

### 2. Install Node Dependencies
```bash
pnpm install
```

### 3. Run in Web / Preview Mode (Fast Dev Loop)
To work on the frontend, Monaco editor, DAG orchestrator, or docs portal directly in the browser:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run the Full Desktop Application (Tauri 2.0 + Rust Core)
To run the native desktop shell with full Rust IPC bridges:
```bash
pnpm tauri dev
```

---

## 📦 Building Standalone Release Binaries

### Automated Build via CLI

To compile self-contained native bundles for your current operating system:
```bash
# Builds frontend assets and native Tauri bundle
pnpm tauri build
```

The resulting binaries will be placed in:
- **Windows**: `src-tauri/target/release/bundle/msi/` (.msi) and `src-tauri/target/release/bundle/nsis/` (.exe)
- **Linux**: `src-tauri/target/release/bundle/appimage/` (.AppImage) and `src-tauri/target/release/bundle/deb/` (.deb)

### Cross-Platform CI/CD via GitHub Actions
A production GitHub Actions matrix workflow is provided in `.github/workflows/build-release.yml`. When you push a tag (e.g. `v0.1.0`), the workflow automatically builds, tests, packages, and attaches releases for both `windows-latest` and `ubuntu-22.04`.

---

## 🧩 Developing a WASM Plugin

Plugins are compiled into WebAssembly using the Extism PDK:

1. Create a Rust library with `crate-type = ["cdylib"]`:
   ```toml
   [dependencies]
   extism-pdk = "1.0.0"
   serde = { version = "1.0", features = ["derive"] }
   serde_json = "1.0"
   ```

2. Implement an exported function:
   ```rust
   use extism_pdk::*;
   use serde::{Deserialize, Serialize};

   #[derive(Deserialize)]
   struct Input { code: String }

   #[derive(Serialize)]
   struct Output { formatted: String, changed: bool }

   #[plugin_fn]
   pub fn format_code(Json(input): Json<Input>) -> FnResult<Json<Output>> {
       Ok(Json(Output {
           formatted: input.code.trim().to_string(),
           changed: true,
       }))
   }
   ```

3. Compile to WASI:
   ```bash
   cargo build --target wasm32-wasip1 --release
   ```

4. Declare permissions in `plugin.json` and load into the Leverage Studios Plugin Manager.

---

## 📄 License

Leverage Studios is open-source software licensed under the [Apache License 2.0](LICENSE).
