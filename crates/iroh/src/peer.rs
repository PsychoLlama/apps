//! A live conversation with one peer.
//!
//! Both directions land here: an [`Endpoint::dial`](crate::Endpoint::dial)
//! and an inbound connection produce the same thing, because from the
//! connection onward they *are* the same thing — who started it stops
//! mattering once it's up.
//!
//! Exactly one handle exists per connection — a dial returns one, and the
//! endpoint's peer handler is given one — so freeing it closes the connection
//! and stops the loop reading from it. Message listeners fan out from that
//! single handle rather than from competing handles, which is what keeps
//! inbound streams from being split between readers at random.

use crate::listeners::{Registry, Subscription};
use crate::protocol::Protocol;
use iroh::endpoint::{Connection, VarInt};
use n0_future::task::{AbortOnDropHandle, spawn};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

/// Close code sent when a host closes a connection itself. Nothing reads
/// it — a deliberate close is not an error — but QUIC requires one.
const CLOSE_CODE: u32 = 0;

/// The connection, the protocol it was opened on, and the single loop
/// reading messages off it.
struct PeerState {
    connection: Connection,
    protocol: Protocol,
    messages: Registry<js_sys::Function>,
    // The read loop, started by the first `onMessage` and kept for the
    // life of the connection. An `AbortOnDropHandle`, so freeing this
    // handle stops it — the same drop that closes the connection.
    reader: RefCell<Option<AbortOnDropHandle<()>>>,
}

/// A live connection to a single peer.
///
/// Holding it keeps the connection open; freeing it closes it.
/// [`Self::send`] pushes a byte string to the other side and
/// [`Self::on_message`] surfaces the ones arriving back. Framing is left to
/// the host — a message is whatever bytes were handed to `send`.
#[wasm_bindgen]
pub struct PeerConnection {
    state: PeerState,
}

impl PeerConnection {
    /// Wrap a live connection with no read loop running. Private: a peer
    /// connection is only ever minted by a dial or an accept.
    pub(crate) fn new(connection: Connection, protocol: Protocol) -> Self {
        Self {
            state: PeerState {
                connection,
                protocol,
                messages: Registry::new(),
                reader: RefCell::new(None),
            },
        }
    }
}

#[wasm_bindgen]
impl PeerConnection {
    /// The connected peer's public identity, as a base32 string — the same
    /// value it advertises as its
    /// [`Identity.endpointId`](crate::Identity::endpoint_id).
    #[wasm_bindgen(getter, js_name = endpointId)]
    pub fn endpoint_id(&self) -> String {
        self.state.connection.remote_id().to_string()
    }

    /// The protocol this connection was opened on — one of the ALPNs the
    /// endpoint declared.
    #[wasm_bindgen(getter)]
    pub fn protocol(&self) -> String {
        self.state.protocol.name().to_owned()
    }

    /// Send one message to the peer, resolving once it has been written.
    /// Rejects if the connection is gone, or if the message is larger than
    /// the protocol's `maxMessageSize` — the peer would refuse to read it,
    /// so failing here turns a silent drop at the far end into an error at
    /// the near one.
    ///
    /// Each message rides its own unidirectional stream, opened and
    /// finished here, so the stream boundary *is* the message boundary and
    /// the host needs no length prefix of its own. The cost is that
    /// messages are ordered only within a stream — two `send`s can land out
    /// of order.
    ///
    /// A sync fn returning a promise, for the same reason as
    /// [`Endpoint::dial`](crate::Endpoint::dial): the future owns a cloned
    /// connection rather than borrowing this handle, so the host freeing it
    /// mid-send can't panic.
    #[wasm_bindgen]
    pub fn send(&self, message: Vec<u8>) -> js_sys::Promise {
        let connection = self.state.connection.clone();
        let limit = self.state.protocol.max_message_size();
        let protocol = self.state.protocol.name().to_owned();

        wasm_bindgen_futures::future_to_promise(async move {
            if message.len() > limit {
                return Err(JsError::new(&format!(
                    "message of {} bytes exceeds the {limit}-byte limit for protocol `{protocol}`",
                    message.len()
                ))
                .into());
            }

            let mut stream = connection
                .open_uni()
                .await
                .map_err(|err| JsError::new(&err.to_string()))?;

            stream
                .write_all(&message)
                .await
                .map_err(|err| JsError::new(&err.to_string()))?;

            // `finish` marks the end of the message and returns
            // immediately; the transport keeps flushing after the stream is
            // dropped, so there's nothing to await here.
            stream
                .finish()
                .map_err(|err| JsError::new(&err.to_string()))?;

            Ok(JsValue::UNDEFINED)
        })
    }

    /// Start reading inbound messages, invoking `on_message` with each one
    /// as a `Uint8Array`. Returns the handle that stops delivery.
    ///
    /// The read loop starts with the first listener and stays up for the
    /// life of the connection, so messages arriving while nothing is
    /// subscribed are read and discarded rather than queued. A stream that
    /// fails or overruns the protocol's `maxMessageSize` is dropped on its
    /// own — one peer sending garbage shouldn't cost us the rest of the
    /// conversation.
    #[wasm_bindgen(js_name = onMessage)]
    pub fn on_message(&self, on_message: js_sys::Function) -> Subscription {
        self.start_reading();
        self.state.messages.subscribe(on_message)
    }

    /// Close the connection, telling the peer it was deliberate.
    ///
    /// Returns immediately: QUIC sends the close frame on a best-effort
    /// basis and there is nothing to flush. Await [`Self::closed`] after it
    /// to know when the connection has actually finished.
    #[wasm_bindgen]
    pub fn close(&self) {
        self.state
            .connection
            .close(VarInt::from_u32(CLOSE_CODE), b"");
    }

    /// Resolves when the connection ends, with the reason it ended —
    /// whether that's this side calling [`Self::close`], the peer doing so,
    /// or the transport failing.
    ///
    /// Each read starts its own wait, so a host that wants one promise
    /// should hold onto it rather than re-reading the property.
    #[wasm_bindgen(getter)]
    pub fn closed(&self) -> js_sys::Promise {
        let connection = self.state.connection.clone();

        wasm_bindgen_futures::future_to_promise(async move {
            let reason = connection.closed().await;
            Ok(JsValue::from_str(&reason.to_string()))
        })
    }
}

impl PeerConnection {
    /// Start the read loop if it isn't already running. One loop per
    /// connection, feeding every listener registered against it.
    fn start_reading(&self) {
        let mut reader = self.state.reader.borrow_mut();
        if reader.is_some() {
            return;
        }

        let connection = self.state.connection.clone();
        let messages = self.state.messages.clone();
        let limit = self.state.protocol.max_message_size();

        *reader = Some(AbortOnDropHandle::new(spawn(async move {
            while let Ok(mut stream) = connection.accept_uni().await {
                let Ok(message) = stream.read_to_end(limit).await else {
                    continue;
                };

                let bytes = js_sys::Uint8Array::from(message.as_slice());
                for listener in messages.listeners() {
                    let _ = listener.call1(&JsValue::NULL, &bytes);
                }
            }
        })));
    }
}
