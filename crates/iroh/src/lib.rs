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
    use iroh::{Endpoint, EndpointId, KeyParsingError, SecretKey, Watcher};
    use n0_future::task::{AbortOnDropHandle, spawn};
    use wasm_bindgen::prelude::*;

    /// ALPN naming the protocol spoken over a peer connection. A dialer
    /// requests it and an accepting endpoint filters incoming connections by
    /// it, so both halves of a [`Connection::dial`] must agree on it.
    ///
    /// iroh multiplexes protocols by ALPN — each capability (blob sync, a
    /// CLI bridge, …) gets its own, dispatched on accept. This is just the
    /// bring-up handshake we dial today; real features will define their own
    /// ALPNs rather than piggy-back on this one.
    const ALPN: &[u8] = b"test-connection";

    /// A live endpoint joined to the relay network. Holding it keeps the
    /// relay connection open; dropping it (the host releasing the JS
    /// handle) tears the endpoint down.
    #[wasm_bindgen]
    pub struct Connection {
        endpoint: Endpoint,
        // Background loop accepting inbound peers, if
        // [`Connection::accept_peers`] has started it. An `AbortOnDropHandle`,
        // so freeing this `Connection` aborts the loop and drops the peer
        // connections it holds open — the same drop that tears the endpoint
        // down.
        accept_task: Option<AbortOnDropHandle<()>>,
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

        /// Dial the peer named by `endpoint_id` over the relay on the
        /// test-connection [`ALPN`]. `endpoint_id` is a base32 identity
        /// string as produced by [`Connection::endpoint_id`] — the value
        /// carried in a
        /// share link. The returned promise resolves with the connected
        /// peer's identity once the connection is established, and rejects
        /// if the id is malformed or the dial fails.
        ///
        /// Implemented as a sync fn returning a promise, rather than an
        /// `async fn`, so its future owns a cloned [`Endpoint`] instead of
        /// borrowing this `Connection`. An `async` method would hold that
        /// borrow for the whole dial, and the host freeing the connection
        /// mid-dial (navigating away) would then panic.
        #[wasm_bindgen]
        pub fn dial(&self, endpoint_id: String) -> js_sys::Promise {
            let endpoint = self.endpoint.clone();
            wasm_bindgen_futures::future_to_promise(async move {
                let endpoint_id: EndpointId = endpoint_id
                    .parse()
                    .map_err(|err: KeyParsingError| JsError::new(&err.to_string()))?;

                let connection = endpoint
                    .connect(endpoint_id, ALPN)
                    .await
                    .map_err(|err| JsError::new(&err.to_string()))?;

                Ok(JsValue::from_str(&connection.remote_id().to_string()))
            })
        }

        /// Start accepting inbound peer connections, invoking `on_peer` with
        /// each connecting peer's base32 identity. This is how a dialled
        /// endpoint observes — and the host logs — the other side of a
        /// [`Connection::dial`]. Calling it again replaces the running loop.
        ///
        /// The loop runs on a background task holding a cloned [`Endpoint`];
        /// its handle lives on this `Connection`, so freeing the connection
        /// aborts the loop and drops the peer connections it holds open.
        #[wasm_bindgen(js_name = acceptPeers)]
        pub fn accept_peers(&mut self, on_peer: js_sys::Function) {
            let endpoint = self.endpoint.clone();
            self.accept_task = Some(AbortOnDropHandle::new(spawn(async move {
                // Hold accepted connections open for the loop's lifetime;
                // dropping one would close it out from under the peer.
                let mut connections = Vec::new();
                while let Some(incoming) = endpoint.accept().await {
                    match incoming.await {
                        Ok(connection) => {
                            let peer = connection.remote_id().to_string();
                            let _ = on_peer.call1(&JsValue::NULL, &JsValue::from_str(&peer));
                            connections.push(connection);
                        }
                        // A failed handshake is that peer's problem; keep
                        // serving the others.
                        Err(_) => continue,
                    }
                }
            })));
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
            // Advertise the test-connection ALPN so inbound dials on it can
            // be accepted; see [`Connection::accept_peers`].
            .alpns(vec![ALPN.to_vec()])
            .bind()
            .await
            .map_err(|err| JsError::new(&err.to_string()))?;

        // Resolves once a relay server finishes its handshake — i.e.
        // we're reachable over the relay network.
        endpoint.online().await;

        Ok(Connection {
            endpoint,
            accept_task: None,
        })
    }
}

#[cfg(target_arch = "wasm32")]
pub use relay::*;
