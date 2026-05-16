//! Hello-world wasm blob consumed by `@app/service-worker`.
//!
//! No `wasm-bindgen` — the surface is intentionally tiny so the
//! shipped artifact stays small and the JS interop stays auditable.
//! The host reads the message out of the module's linear memory
//! using the two exported accessors below.

#![no_std]

static HELLO: &[u8] = b"Hello, world";

/// Pointer to the first byte of the message in linear memory.
#[unsafe(no_mangle)]
pub extern "C" fn message_ptr() -> *const u8 {
    HELLO.as_ptr()
}

/// Length of the message in bytes.
#[unsafe(no_mangle)]
pub extern "C" fn message_len() -> usize {
    HELLO.len()
}

// `#![no_std]` removes the default panic handler. The crate has no
// fallible code paths, but the compiler still requires one.
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}
