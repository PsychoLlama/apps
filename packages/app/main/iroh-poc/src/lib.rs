//! Browser-side iroh POC: a tiny echo protocol exposed to JavaScript.
//!
//! Runs the iroh endpoint inside the page (relay-only, no UDP holepunching
//! from the browser sandbox). Two roles share the same node:
//!
//! - **Server**: builds an [`Endpoint`] with the echo ALPN registered, then
//!   yields incoming-connection events through [`EchoNode::events`].
//! - **Client**: dials a known endpoint id via [`EchoNode::connect`], sends
//!   one payload, and reports back what came over the wire.

use anyhow::{Context, Result};
use async_channel::Sender;
use iroh::{
    Endpoint, EndpointAddr,
    endpoint::Connection,
    protocol::{AcceptError, ProtocolHandler, Router},
};
use n0_future::{Stream, StreamExt, task};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use tokio_stream::wrappers::BroadcastStream;
use tracing::info;
use wasm_bindgen::{JsError, prelude::wasm_bindgen};
use wasm_streams::{ReadableStream, readable::sys::ReadableStream as JsReadableStream};

const ECHO_ALPN: &[u8] = b"iroh-poc/echo/0";

#[wasm_bindgen(start)]
fn start() {
    // Surface Rust panics in the browser console — without this, an
    // unwinding panic just trashes the wasm instance silently. No
    // `tracing-subscriber` setup: iroh's `tracing` calls turn into
    // no-ops in release thanks to `release_max_level_off`, which keeps
    // the regex/formatter machinery out of the bundle.
    console_error_panic_hook::set_once();
}

/// JS-facing handle to an iroh endpoint that speaks the echo protocol.
#[wasm_bindgen]
pub struct EchoNode {
    router: Router,
    accept_events: broadcast::Sender<AcceptEvent>,
}

#[wasm_bindgen]
impl EchoNode {
    /// Bind a fresh endpoint with the n0 relay preset and start accepting
    /// echo connections.
    pub async fn spawn() -> Result<EchoNode, JsError> {
        let endpoint = Endpoint::builder(iroh::endpoint::presets::N0)
            .alpns(vec![ECHO_ALPN.to_vec()])
            .bind()
            .await
            .map_err(to_js_err)?;
        let (accept_events, _) = broadcast::channel(128);
        let echo = Echo {
            events: accept_events.clone(),
        };
        let router = Router::builder(endpoint)
            .accept(ECHO_ALPN, echo)
            .spawn();
        Ok(Self {
            router,
            accept_events,
        })
    }

    /// Stable identifier other peers dial. Stringified ed25519 public key.
    #[wasm_bindgen(js_name = endpointId)]
    pub fn endpoint_id(&self) -> String {
        self.router.endpoint().id().to_string()
    }

    /// JSON-serialized [`EndpointAddr`] — endpoint id plus the assigned
    /// home-relay URL. Awaits [`Endpoint::online`] so the relay is
    /// resolved before serialization, which lets a remote dialer
    /// connect without waiting for discovery to propagate.
    pub async fn ticket(&self) -> Result<String, JsError> {
        let endpoint = self.router.endpoint();
        endpoint.online().await;
        let addr = endpoint.addr();
        serde_json::to_string(&addr).map_err(to_js_err)
    }

    /// `ReadableStream<AcceptEvent>` of inbound connection lifecycle events.
    pub fn events(&self) -> JsReadableStream {
        let receiver = self.accept_events.subscribe();
        let stream = BroadcastStream::new(receiver).filter_map(|event| event.ok());
        into_js_readable_stream(stream)
    }

    /// Dial the host described by `ticket` (a JSON-encoded
    /// [`EndpointAddr`]), send `payload` over a bidi stream, and yield
    /// progress events back as JS objects.
    pub fn connect(
        &self,
        ticket: String,
        payload: String,
    ) -> Result<JsReadableStream, JsError> {
        let addr: EndpointAddr = serde_json::from_str(&ticket)
            .context("failed to parse connect ticket as JSON EndpointAddr")
            .map_err(to_js_err)?;
        let endpoint = self.router.endpoint().clone();
        let (sender, receiver) = async_channel::bounded(16);
        task::spawn(async move {
            let result = run_client(&endpoint, addr, payload, sender.clone()).await;
            let error = result.as_ref().err().map(|err| err.to_string());
            sender.send(ConnectEvent::Closed { error }).await.ok();
        });
        Ok(into_js_readable_stream(receiver))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum ConnectEvent {
    Connected,
    Sent { bytes: u64 },
    Echoed { text: String },
    Closed { error: Option<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum AcceptEvent {
    Accepted {
        endpoint_id: String,
    },
    Echoed {
        endpoint_id: String,
        text: String,
    },
    Closed {
        endpoint_id: String,
        error: Option<String>,
    },
}

#[derive(Debug, Clone)]
struct Echo {
    events: broadcast::Sender<AcceptEvent>,
}

impl ProtocolHandler for Echo {
    async fn accept(&self, connection: Connection) -> std::result::Result<(), AcceptError> {
        let endpoint_id = connection.remote_id().to_string();
        self.events
            .send(AcceptEvent::Accepted {
                endpoint_id: endpoint_id.clone(),
            })
            .ok();

        let result = run_server(&connection, &self.events, &endpoint_id).await;
        let error = result.as_ref().err().map(|err| err.to_string());
        self.events
            .send(AcceptEvent::Closed {
                endpoint_id,
                error,
            })
            .ok();
        result
    }
}

/// Server side: read the entire payload from the bidi stream, send it
/// back, finish the send half, then wait for the peer to close.
async fn run_server(
    connection: &Connection,
    events: &broadcast::Sender<AcceptEvent>,
    endpoint_id: &str,
) -> std::result::Result<(), AcceptError> {
    info!("accepted connection from {endpoint_id}");
    let (mut send, mut recv) = connection.accept_bi().await?;

    let payload = recv.read_to_end(64 * 1024).await.map_err(AcceptError::from_err)?;
    send.write_all(&payload).await.map_err(AcceptError::from_err)?;
    send.finish()?;

    let text = String::from_utf8_lossy(&payload).into_owned();
    events
        .send(AcceptEvent::Echoed {
            endpoint_id: endpoint_id.to_owned(),
            text,
        })
        .ok();

    connection.closed().await;
    Ok(())
}

/// Client side: open a bidi stream, write the payload, finish the send
/// half, read everything echoed back, then close the connection.
async fn run_client(
    endpoint: &Endpoint,
    addr: EndpointAddr,
    payload: String,
    events: Sender<ConnectEvent>,
) -> Result<()> {
    let connection = endpoint.connect(addr, ECHO_ALPN).await?;
    events.send(ConnectEvent::Connected).await?;

    let (mut send, mut recv) = connection.open_bi().await?;
    let bytes = payload.len() as u64;
    send.write_all(payload.as_bytes()).await?;
    send.finish()?;
    events.send(ConnectEvent::Sent { bytes }).await?;

    let echoed = recv.read_to_end(64 * 1024).await?;
    let text = String::from_utf8_lossy(&echoed).into_owned();
    events.send(ConnectEvent::Echoed { text }).await?;

    connection.close(0u8.into(), b"done");
    Ok(())
}

fn to_js_err(err: impl Into<anyhow::Error>) -> JsError {
    JsError::new(&err.into().to_string())
}

fn into_js_readable_stream<T: Serialize>(
    stream: impl Stream<Item = T> + 'static,
) -> JsReadableStream {
    let stream = stream.map(|event| Ok(serde_wasm_bindgen::to_value(&event).unwrap()));
    ReadableStream::from_stream(stream).into_raw()
}
