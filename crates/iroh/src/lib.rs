//! Wasm bindings over [`iroh`] for joining the public relay network from
//! the browser.
//!
//! In the browser iroh can't hole-punch, so it runs relay-only: QUIC is
//! tunnelled over a WebSocket to a relay server, end-to-end encrypted.
//! [`join_relay`] binds an endpoint to n0's public relays and resolves once
//! the relay handshake lands — the host then holds a live [`Relay`] and
//! opens [`PeerConnection`]s through it. Because it's relay-only, every peer
//! connection rides over that one relay membership.

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
    use iroh::endpoint::{Connection, presets};
    use iroh::{Endpoint, EndpointId, KeyParsingError, SecretKey, Watcher};
    use n0_future::task::{AbortOnDropHandle, spawn};
    use wasm_bindgen::prelude::*;

    /// ALPN naming the protocol spoken over a peer connection. A dialer
    /// requests it and an accepting endpoint filters incoming connections by
    /// it, so both halves of a [`Relay::dial`] must agree on it.
    ///
    /// iroh multiplexes protocols by ALPN — each capability (blob sync, a
    /// CLI bridge, …) gets its own, dispatched on accept. This is just the
    /// bring-up handshake we dial today; real features will define their own
    /// ALPNs rather than piggy-back on this one.
    const ALPN: &[u8] = b"test-connection";

    /// Largest inbound message [`PeerConnection::on_message`] will read off a
    /// stream. Everything spoken over this ALPN today is a short control
    /// frame, so this is a ceiling on what an unauthenticated peer can make
    /// us buffer rather than a budget anything real is expected to approach.
    /// A stream that overruns it is dropped; the connection carries on.
    const MAX_MESSAGE_BYTES: usize = 64 * 1024;

    /// A live endpoint joined to the relay network. Holding it keeps the
    /// relay connection open; dropping it (the host releasing the JS
    /// handle) tears the endpoint down.
    ///
    /// In the browser iroh is relay-only, so this is the one membership every
    /// peer connection rides over: [`Relay::dial`] opens a [`PeerConnection`]
    /// through it, and [`Relay::accept_peers`] surfaces inbound ones. This is
    /// the network handle; a [`PeerConnection`] is a single peer on it.
    #[wasm_bindgen]
    pub struct Relay {
        endpoint: Endpoint,
        // Background loop accepting inbound peers, if [`Relay::accept_peers`]
        // has started it. An `AbortOnDropHandle`, so freeing this `Relay`
        // aborts the loop and drops the peer connections it holds open — the
        // same drop that tears the endpoint down.
        accept_task: Option<AbortOnDropHandle<()>>,
    }

    /// A live connection to a single peer, riding over the [`Relay`] it was
    /// opened through. Produced by [`Relay::dial`] and handed to the
    /// [`Relay::accept_peers`] callback. Holding it keeps the peer connection
    /// open; dropping it (the host releasing the JS handle) closes it.
    ///
    /// Carries the peer's identity plus a message channel: [`Self::send`]
    /// pushes a byte string to the other side and [`Self::on_message`]
    /// surfaces the ones arriving back. Framing is left to the host — a
    /// message is whatever bytes were handed to `send`.
    #[wasm_bindgen]
    pub struct PeerConnection {
        connection: Connection,
        // Background loop reading inbound messages, if [`Self::on_message`]
        // has started it. An `AbortOnDropHandle`, so freeing this handle
        // stops the loop — which makes holding the handle the thing that
        // keeps messages flowing, and dropping it the way to stop listening.
        receive_task: Option<AbortOnDropHandle<()>>,
    }

    impl PeerConnection {
        /// Wrap a live connection with no receive loop running. Private: a
        /// `PeerConnection` is only ever minted by a dial or an accept.
        fn new(connection: Connection) -> Self {
            Self {
                connection,
                receive_task: None,
            }
        }
    }

    #[wasm_bindgen]
    impl PeerConnection {
        /// The connected peer's public identity, as a base32 string — the
        /// same value it advertises as its [`Relay::endpoint_id`].
        #[wasm_bindgen(getter, js_name = remoteId)]
        pub fn remote_id(&self) -> String {
            self.connection.remote_id().to_string()
        }

        /// Send one message to the peer, resolving once it has been written.
        /// Rejects if the connection is gone.
        ///
        /// Each message rides its own unidirectional stream, opened and
        /// finished here, so the stream boundary *is* the message boundary
        /// and the host needs no length prefix of its own. The cost is that
        /// messages are ordered only within a stream — two `send`s can land
        /// out of order — which is fine for the independent control frames
        /// spoken over this ALPN.
        ///
        /// A sync fn returning a promise, for the same reason as
        /// [`Relay::dial`]: the future owns a cloned [`Connection`] rather
        /// than borrowing `self`, so the host freeing this handle mid-send
        /// can't panic.
        #[wasm_bindgen]
        pub fn send(&self, message: Vec<u8>) -> js_sys::Promise {
            let connection = self.connection.clone();
            wasm_bindgen_futures::future_to_promise(async move {
                let mut stream = connection
                    .open_uni()
                    .await
                    .map_err(|err| JsError::new(&err.to_string()))?;

                stream
                    .write_all(&message)
                    .await
                    .map_err(|err| JsError::new(&err.to_string()))?;

                // `finish` marks the end of the message and returns
                // immediately; the transport keeps flushing after the stream
                // is dropped, so there's nothing to await here.
                stream
                    .finish()
                    .map_err(|err| JsError::new(&err.to_string()))?;

                Ok(JsValue::UNDEFINED)
            })
        }

        /// Start reading inbound messages, invoking `on_message` with each
        /// one as a `Uint8Array`. Calling it again replaces the running loop.
        ///
        /// The loop ends when the connection closes or this handle is freed.
        /// A stream that fails or overruns [`MAX_MESSAGE_BYTES`] is dropped
        /// on its own — one peer sending garbage shouldn't cost us the rest
        /// of the conversation.
        #[wasm_bindgen(js_name = onMessage)]
        pub fn on_message(&mut self, on_message: js_sys::Function) {
            let connection = self.connection.clone();
            self.receive_task = Some(AbortOnDropHandle::new(spawn(async move {
                while let Ok(mut stream) = connection.accept_uni().await {
                    let Ok(message) = stream.read_to_end(MAX_MESSAGE_BYTES).await else {
                        continue;
                    };

                    let bytes = js_sys::Uint8Array::from(message.as_slice());
                    let _ = on_message.call1(&JsValue::NULL, &bytes);
                }
            })));
        }
    }

    #[wasm_bindgen]
    impl Relay {
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
        /// test-connection [`ALPN`], resolving with a live [`PeerConnection`]
        /// once established. `endpoint_id` is a base32 identity string as
        /// produced by [`Relay::endpoint_id`] — the value carried in a share
        /// link. Rejects if the id is malformed or the dial fails.
        ///
        /// Implemented as a sync fn returning a promise, rather than an
        /// `async fn`, so its future owns a cloned [`Endpoint`] instead of
        /// borrowing this `Relay`. An `async` method would hold that borrow
        /// for the whole dial, and the host freeing the relay mid-dial
        /// (navigating away) would then panic.
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

                Ok(PeerConnection::new(connection).into())
            })
        }

        /// Start accepting inbound peer connections, invoking `on_peer` with
        /// a [`PeerConnection`] for each connecting peer. This is the other
        /// side of a [`Relay::dial`]: the host retains the handle to talk
        /// back over it. Calling it again replaces the running loop.
        ///
        /// The loop runs on a background task holding a cloned [`Endpoint`];
        /// its handle lives on this `Relay`, so freeing the relay aborts the
        /// loop and drops the peer connections it holds open. It keeps each
        /// accepted connection alive for the loop's lifetime and hands the
        /// host a cloned [`PeerConnection`] to observe, so freeing that handle
        /// doesn't close the connection out from under the loop.
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
                            let peer = PeerConnection::new(connection.clone());
                            let _ = on_peer.call1(&JsValue::NULL, &JsValue::from(peer));
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
    pub async fn join_relay(secret_key: Vec<u8>) -> Result<Relay, JsError> {
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

        Ok(Relay {
            endpoint,
            accept_task: None,
        })
    }
}

#[cfg(target_arch = "wasm32")]
pub use relay::*;
