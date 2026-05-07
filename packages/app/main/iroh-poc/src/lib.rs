//! Browser-side iroh chat POC. The page hosts an iroh endpoint and
//! exposes a symmetric `Session` handle for both directions:
//!
//! - **Accepting**: `EchoNode::sessions()` is a `ReadableStream<Session>`
//!   that yields a fresh handle for each inbound connection.
//! - **Dialing**: `EchoNode::connect(ticket)` resolves to the same
//!   `Session` shape.
//!
//! Each chat message rides its own short-lived unidirectional stream,
//! so we get framing for free — `read_to_end` returns when the sender
//! finishes — and concurrent `send()` calls naturally multiplex.

use anyhow::{Context, Result};
use async_channel::{Receiver, Sender};
use iroh::{
    Endpoint, EndpointAddr,
    endpoint::Connection,
    protocol::{AcceptError, ProtocolHandler, Router},
};
use n0_future::{StreamExt, task};
use wasm_bindgen::{JsError, JsValue, prelude::wasm_bindgen};
use wasm_streams::{ReadableStream, readable::sys::ReadableStream as JsReadableStream};

const CHAT_ALPN: &[u8] = b"iroh-poc/chat/0";
const MAX_MESSAGE_BYTES: usize = 64 * 1024;

#[wasm_bindgen(start)]
fn start() {
    // Surface Rust panics in the browser console — without this, an
    // unwinding panic just trashes the wasm instance silently.
    console_error_panic_hook::set_once();
}

/// JS-facing handle to an iroh endpoint that speaks the chat protocol.
#[wasm_bindgen]
pub struct EchoNode {
    router: Router,
    incoming: Receiver<Session>,
}

#[wasm_bindgen]
impl EchoNode {
    /// Bind a fresh endpoint with the n0 relay preset and start
    /// accepting chat connections.
    pub async fn spawn() -> Result<EchoNode, JsError> {
        let endpoint = Endpoint::builder(iroh::endpoint::presets::N0)
            .alpns(vec![CHAT_ALPN.to_vec()])
            .bind()
            .await
            .map_err(to_js_err)?;
        let (incoming_tx, incoming_rx) = async_channel::unbounded();
        let chat = Chat {
            incoming: incoming_tx,
        };
        let router = Router::builder(endpoint).accept(CHAT_ALPN, chat).spawn();
        Ok(Self {
            router,
            incoming: incoming_rx,
        })
    }

    /// Stable identifier other peers dial. Stringified ed25519 public key.
    #[wasm_bindgen(js_name = endpointId)]
    pub fn endpoint_id(&self) -> String {
        self.router.endpoint().id().to_string()
    }

    /// JSON-serialized [`EndpointAddr`] — endpoint id plus the assigned
    /// home-relay URL. Awaits [`Endpoint::online`] so the dialer can
    /// reach us without waiting on DNS discovery to propagate.
    pub async fn ticket(&self) -> Result<String, JsError> {
        let endpoint = self.router.endpoint();
        endpoint.online().await;
        let addr = endpoint.addr();
        serde_json::to_string(&addr).map_err(to_js_err)
    }

    /// `ReadableStream<Session>` of inbound chat sessions. Each value
    /// is a wasm-bindgen `Session` instance.
    pub fn sessions(&self) -> JsReadableStream {
        let receiver = self.incoming.clone();
        let stream = receiver.map(|session| Ok(JsValue::from(session)));
        ReadableStream::from_stream(stream).into_raw()
    }

    /// Dial the peer described by `ticket` and resolve to a fresh
    /// [`Session`] once the QUIC handshake completes.
    pub async fn connect(&self, ticket: String) -> Result<Session, JsError> {
        let addr: EndpointAddr = serde_json::from_str(&ticket)
            .context("failed to parse connect ticket as JSON EndpointAddr")
            .map_err(to_js_err)?;
        let connection = self
            .router
            .endpoint()
            .connect(addr, CHAT_ALPN)
            .await
            .map_err(to_js_err)?;
        Ok(Session::from_connection(connection))
    }
}

#[derive(Clone, Debug)]
struct Chat {
    incoming: Sender<Session>,
}

impl ProtocolHandler for Chat {
    async fn accept(&self, connection: Connection) -> std::result::Result<(), AcceptError> {
        let session = Session::from_connection(connection.clone());
        if self.incoming.send(session).await.is_err() {
            // Receiver dropped — node is shutting down. Bail gracefully.
            return Ok(());
        }
        // Hold the accept future open so iroh keeps the connection
        // around for the JS-owned `Session` to use.
        connection.closed().await;
        Ok(())
    }
}

/// JS-facing handle to a single live chat connection.
#[wasm_bindgen]
pub struct Session {
    peer_id: String,
    connection: Connection,
    incoming: Receiver<String>,
}

impl Session {
    fn from_connection(connection: Connection) -> Self {
        let peer_id = connection.remote_id().to_string();
        let (sender, receiver) = async_channel::unbounded::<String>();
        let conn = connection.clone();
        task::spawn(async move {
            // One message per uni stream. The sender finishes the
            // stream after writing, which lets us use `read_to_end` as
            // a natural framing boundary.
            loop {
                let mut recv = match conn.accept_uni().await {
                    Ok(stream) => stream,
                    Err(_) => break,
                };
                let bytes = match recv.read_to_end(MAX_MESSAGE_BYTES).await {
                    Ok(bytes) => bytes,
                    Err(_) => continue,
                };
                let text = String::from_utf8_lossy(&bytes).into_owned();
                if sender.send(text).await.is_err() {
                    break;
                }
            }
        });
        Self {
            peer_id,
            connection,
            incoming: receiver,
        }
    }
}

#[wasm_bindgen]
impl Session {
    /// Stringified ed25519 public key of the remote peer.
    #[wasm_bindgen(js_name = peerId)]
    pub fn peer_id(&self) -> String {
        self.peer_id.clone()
    }

    /// Send a single message. Each call opens a fresh uni stream, so
    /// concurrent calls are safe — they multiplex over the connection.
    pub async fn send(&self, text: String) -> Result<(), JsError> {
        let mut send = self.connection.open_uni().await.map_err(to_js_err)?;
        send.write_all(text.as_bytes()).await.map_err(to_js_err)?;
        send.finish().map_err(to_js_err)?;
        Ok(())
    }

    /// `ReadableStream<string>` of inbound messages. Should be awaited
    /// from one consumer only — multiple readers split the stream.
    pub fn messages(&self) -> JsReadableStream {
        let receiver = self.incoming.clone();
        let stream = receiver.map(|text| Ok(JsValue::from_str(&text)));
        ReadableStream::from_stream(stream).into_raw()
    }

    /// Resolves once the connection closes from either side.
    pub async fn closed(&self) {
        self.connection.closed().await;
    }

    /// Tear the connection down locally.
    pub fn close(&self) {
        self.connection.close(0u8.into(), b"closed");
    }
}

fn to_js_err<E: std::fmt::Display>(err: E) -> JsError {
    JsError::new(&err.to_string())
}
