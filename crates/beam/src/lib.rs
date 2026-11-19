//! Beam, below the UI: a [woodland] database and the [iroh] endpoint that
//! carries it, behind one wasm boundary.
//!
//! This is the app, not a library. The JS surface is beam's own verbs, and
//! the two crates are composed here in Rust because wasm modules don't
//! compose: one module owns the device's key, its store, and its place on
//! the network.
//!
//! [woodland]: https://github.com/Ambient-Computer/woodland
//! [iroh]: https://iroh.computer

use wasm_bindgen::prelude::*;

// Everything below is the browser's: IndexedDB under woodland, a relay
// under iroh. Neither builds nor means anything off wasm — see the
// target-gated dependencies in Cargo.toml.
#[cfg(target_arch = "wasm32")]
mod device;

#[cfg(target_arch = "wasm32")]
pub use device::Device;

/// Install the panic hook once at module load so a Rust panic surfaces as
/// a readable `console.error` instead of an opaque `unreachable` trap.
/// No-op unless the `console_error_panic_hook` feature is on.
#[wasm_bindgen(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
