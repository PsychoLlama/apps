//! Wasm bindings over [`iroh`] for joining the public relay network from
//! the browser.
//!
//! In the browser iroh can't hole-punch, so it runs relay-only: QUIC is
//! tunnelled over a WebSocket to a relay server, end-to-end encrypted.
//! [`connect`] binds an endpoint to n0's public relays and resolves once
//! the relay handshake lands — the host then holds a live [`Connection`]
//! and reads back its identity off it.

use wasm_bindgen::prelude::*;

/// Install the panic hook once at module load so a Rust panic surfaces as
/// a readable `console.error` instead of an opaque `unreachable` trap.
/// No-op unless the `console_error_panic_hook` feature is on.
#[wasm_bindgen(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Everything below talks to iroh, which only builds (and only means
// anything) on wasm — see the target-gated dependency in Cargo.toml.
#[cfg(target_arch = "wasm32")]
mod relay {
    use iroh::endpoint::presets;
    use iroh::{Endpoint, SecretKey, Watcher};
    use wasm_bindgen::prelude::*;

    /// A live endpoint joined to the relay network. Holding it keeps the
    /// relay connection open; dropping it (the host releasing the JS
    /// handle) tears the endpoint down.
    #[wasm_bindgen]
    pub struct Connection {
        endpoint: Endpoint,
    }

    #[wasm_bindgen]
    impl Connection {
        /// This endpoint's public identity, as a base32 string — the
        /// address a peer dials to reach us.
        #[wasm_bindgen(getter, js_name = endpointId)]
        pub fn endpoint_id(&self) -> String {
            self.endpoint.id().to_string()
        }

        /// The URL of the relay we're currently connected through, or
        /// `undefined` if none has finished its handshake yet.
        #[wasm_bindgen(getter, js_name = homeRelay)]
        pub fn home_relay(&self) -> Option<String> {
            self.endpoint
                .home_relay_status()
                .get()
                .into_iter()
                .find(|status| status.is_connected())
                .map(|status| status.url().to_string())
        }
    }

    /// Mint a fresh endpoint identity, returning its secret key as the raw
    /// 32 bytes. The host persists this and hands it to [`join_relay`] to
    /// keep a stable identity (and share link) across reloads. Treat it as
    /// a secret. Generating the key here — rather than deriving it inside
    /// [`join_relay`] — lets the host persist and connect in parallel.
    #[wasm_bindgen(js_name = generateSecretKey)]
    pub fn generate_secret_key() -> Vec<u8> {
        SecretKey::generate().to_bytes().to_vec()
    }

    /// Bind an endpoint under the given identity and join n0's public relay
    /// network, resolving once at least one relay handshake completes. This
    /// is a connection to the relay network, not to a peer.
    ///
    /// `secret_key` is the raw 32 bytes from [`generate_secret_key`] (or a
    /// previously persisted one). Rejects if the key is malformed or
    /// binding fails.
    #[wasm_bindgen(js_name = joinRelay)]
    pub async fn join_relay(secret_key: Vec<u8>) -> Result<Connection, JsError> {
        let secret_key: [u8; 32] = secret_key
            .try_into()
            .map_err(|_| JsError::new("secret key must be exactly 32 bytes"))?;

        let endpoint = Endpoint::builder(presets::N0)
            .secret_key(SecretKey::from_bytes(&secret_key))
            .bind()
            .await
            .map_err(|err| JsError::new(&err.to_string()))?;

        // Resolves once a relay server finishes its handshake — i.e.
        // we're reachable over the relay network.
        endpoint.online().await;

        Ok(Connection { endpoint })
    }
}

#[cfg(target_arch = "wasm32")]
pub use relay::*;
