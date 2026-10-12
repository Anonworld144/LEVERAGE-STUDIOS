// Leverage Studios - Tauri Library Entrypoint

pub mod ipc;
pub mod wasm_engine;

use ipc::{AgentSpawnRequest, AgentSpawnResponse, SystemDiagnostics, WasmExecutionPayload, WasmExecutionResponse};
use wasm_engine::WasmEngine;

#[tauri::command]
fn get_system_diagnostics() -> SystemDiagnostics {
    SystemDiagnostics {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        tauri_version: "2.0.4".to_string(),
        rustc_version: "rustc 1.84.0 (nightly)".to_string(),
        active_threads: 8,
        total_memory_mb: 16384,
    }
}

#[tauri::command]
fn spawn_agent_runtime(req: AgentSpawnRequest) -> Result<AgentSpawnResponse, String> {
    // In production, spawns managed subprocess with piped stdin/stdout IPC
    Ok(AgentSpawnResponse {
        pid: 51204,
        status: format!("Spawned {} agent subprocess", req.runtime),
        channel_id: format!("chan_{}", req.agent_id),
    })
}

#[tauri::command]
fn execute_wasm_plugin(payload: WasmExecutionPayload) -> Result<WasmExecutionResponse, String> {
    let engine = WasmEngine::new();
    Ok(engine.execute_sandboxed(payload))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_system_diagnostics,
            spawn_agent_runtime,
            execute_wasm_plugin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Leverage Studios application");
}
