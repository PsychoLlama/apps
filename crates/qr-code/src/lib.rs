//! Wasm bindings over [`rxing`] (a pure-Rust ZXing port) for QR codes in
//! the browser, in both directions:
//!
//! - [`decode`](decode::decode) reads a code out of raw canvas image data.
//! - [`encode`](encode::encode) generates a code's module grid from text.
//!
//! Both surfaces compile into a single wasm blob — wasm-bindgen collects
//! the `#[wasm_bindgen]` items from every module, so the host inits one
//! module and reaches whichever direction it needs.

use wasm_bindgen::prelude::*;

mod decode;
mod encode;

/// Install the panic hook once at module load so a Rust panic surfaces
/// as a readable `console.error` instead of an opaque `unreachable`
/// trap. No-op unless the `console_error_panic_hook` feature is on.
#[wasm_bindgen(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
