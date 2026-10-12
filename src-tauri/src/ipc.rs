// Leverage Studios - Native Rust IPC Interface
// Connects Tauri to Node.js / Python agent subprocesses and provides WASM execution hooks.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentSpawnRequest {
    pub agent_id: String,
    pub runtime: String, // "node" | "python"
    pub entry_script: String,
    pub env_vars: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentSpawnResponse {
    pub pid: u32,
    pub status: String,
    pub channel_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WasmExecutionPayload {
    pub plugin_id: String,
    pub function_name: String,
    pub input_json: String,
    pub memory_limit_mb: u32,
    pub gas_limit: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WasmExecutionResponse {
    pub success: bool,
    pub output_json: String,
    pub gas_used: u64,
    pub memory_peak_kb: u64,
    pub execution_time_ms: f64,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemDiagnostics {
    pub os: String,
    pub arch: String,
    pub tauri_version: String,
    pub rustc_version: String,
    pub active_threads: usize,
    pub total_memory_mb: u64,
}
