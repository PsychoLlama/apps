//! Wasm bindings over [`iroh`] for joining the public relay network from
//! the browser.
//!
//! In the browser iroh can't hole-punch, so it runs relay-only: QUIC is
//! tunnelled over a WebSocket to a relay server, end-to-end encrypted.
//!
//! Three things, in the order a host reaches for them:
//!
//! - [`Identity`] is a validated secret key and the address it implies.
//!   No network, no lifecycle — mint or restore one, read its address,
//!   persist it.
//! - [`Endpoint`] is this device on the network. It's defined under an
//!   identity, a set of protocols, and its handlers first, joined second,
//!   so nothing can arrive before there's somewhere to put it.
//! - [`PeerConnection`] is one conversation with one peer, the same object
//!   whether it was dialled or accepted.
//!
//! None of it is a singleton: two identities can hold two endpoints at
//! once, and nothing is stored at module scope.
//!
//! Every handle here frees deterministically. wasm-bindgen aliases
//! `Symbol.dispose` to `free`, so a host can reach for `using` instead of
//! tracking teardown by hand.

use wasm_bindgen::prelude::*;

// Logic that stands clear of iroh, and so is exercised by the native
// tests. Off the wasm target nothing but those tests uses it, which is
// what the `dead_code` allowance is for.
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
mod protocol;
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
mod secret_key;

// Everything below talks to iroh, which only builds (and only means
// anything) on wasm — see the target-gated dependency in Cargo.toml.
#[cfg(target_arch = "wasm32")]
mod endpoint;
#[cfg(target_arch = "wasm32")]
mod identity;
#[cfg(target_arch = "wasm32")]
mod peer;

#[cfg(target_arch = "wasm32")]
pub use endpoint::{Endpoint, EndpointOptions};
#[cfg(target_arch = "wasm32")]
pub use identity::Identity;
#[cfg(target_arch = "wasm32")]
pub use peer::PeerConnection;

/// Install the panic hook once at module load so a Rust panic surfaces as
/// a readable `console.error` instead of an opaque `unreachable` trap.
/// No-op unless the `console_error_panic_hook` feature is on.
#[wasm_bindgen(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
