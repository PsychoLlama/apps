//! Membership in the relay network.
//!
//! A relay is defined before it connects: the identity it runs under, the
//! protocols it speaks, and its handlers are all settled up front, because
//! iroh needs the ALPNs at bind time, a host wants its address before the
//! handshake, and anything arriving the instant the connection lands needs
//! somewhere to go.
//!
//! In the browser iroh is relay-only — no hole-punching — so QUIC is
//! tunnelled over a WebSocket to a relay server, end-to-end encrypted, and
//! every peer connection rides over this one membership.

use crate::identity::Identity;
use crate::peer::PeerConnection;
use crate::protocol::{Protocol, ProtocolTable};
use iroh::endpoint::presets;
use iroh::{Endpoint, EndpointId, KeyParsingError, SecretKey, Watcher};
use n0_future::StreamExt;
use n0_future::task::{AbortOnDropHandle, spawn};
use std::cell::{Cell, RefCell};
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    /// Everything about a relay other than its identity: the protocols it
    /// speaks and the handlers it runs. An options bag rather than
    /// positional arguments because it's the part expected to grow — relay
    /// server selection is the obvious next entry.
    ///
    /// The identity stays positional because wasm-bindgen can only unwrap
    /// an exported class at an argument position; one nested in a plain
    /// object arrives as an opaque value it can't convert back.
    #[wasm_bindgen(typescript_type = "RelayOptions")]
    pub type RelayOptions;
}

/// Where a relay sits in its lifecycle. Tracked separately from the bound
/// endpoint so a connect that's still in flight is distinguishable from
/// one that never started — which is what stops two concurrent
/// [`Relay::connect`] calls both getting past the guard and binding twice.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Phase {
    Defined,
    Connecting,
    Connected,
    Closed,
}

/// What a relay handle owns, behind an [`Rc`] so the background loops can
/// hold it without borrowing the handle across an await.
struct RelayState {
    identity: SecretKey,
    protocols: ProtocolTable,
    phase: Cell<Phase>,
    endpoint: RefCell<Option<Endpoint>>,
    on_peer_connection: js_sys::Function,
    on_connection_change: Option<js_sys::Function>,
    // The accept loop and, if anything is watching, the home-relay watcher.
    // `AbortOnDropHandle`s, so freeing the relay stops both.
    tasks: RefCell<Vec<AbortOnDropHandle<()>>>,
}

/// A relay membership: defined by [`Relay::new`], live after
/// [`Relay::connect`], and torn down by [`Relay::close`] or by freeing the
/// handle.
///
/// This is the network handle; a [`PeerConnection`] is a single peer on it.
/// [`Relay::dial`] opens one, and the `onPeerConnection` handler given at
/// construction surfaces the inbound ones.
#[wasm_bindgen]
pub struct Relay {
    state: Rc<RelayState>,
}

#[wasm_bindgen]
impl Relay {
    /// Define a relay without connecting it. Validates the options and
    /// throws on anything the host got wrong — an empty protocol table, a
    /// name too long for an ALPN, a message ceiling that isn't a sane byte
    /// count, a missing peer handler.
    ///
    /// Handlers are given here rather than registered afterwards, so there
    /// is no moment when a relay is running and nothing is listening.
    /// `onPeerConnection` is required — a peer arriving in that window would
    /// have to be turned away, which is invisible to the host and nearly
    /// invisible to the dialer. `onConnectionChange` is optional, because
    /// missing a status change costs nothing: [`Self::home_relay`] reports
    /// the current state on demand.
    ///
    /// Nothing here touches the network — call [`Self::connect`] next.
    #[wasm_bindgen(js_name = new)]
    pub fn create(identity: &Identity, options: &RelayOptions) -> Result<Relay, JsError> {
        let protocols = read_protocols(options)?;
        let on_peer_connection = read_peer_handler(options)?;
        let on_connection_change = read_connection_handler(options)?;

        Ok(Relay {
            state: Rc::new(RelayState {
                identity: identity.secret(),
                protocols,
                phase: Cell::new(Phase::Defined),
                endpoint: RefCell::new(None),
                on_peer_connection,
                on_connection_change,
                tasks: RefCell::new(Vec::new()),
            }),
        })
    }

    /// The address peers dial to reach this relay, as a base32 string.
    /// The same value as the identity's, repeated here so a host holding a
    /// relay doesn't have to carry the identity alongside it.
    #[wasm_bindgen(getter, js_name = endpointId)]
    pub fn endpoint_id(&self) -> String {
        self.state.identity.public().to_string()
    }

    /// The URL of the relay server currently carrying this connection, or
    /// `undefined` if none has finished its handshake.
    #[wasm_bindgen(getter, js_name = homeRelay)]
    pub fn home_relay(&self) -> Option<String> {
        let endpoint = self.state.endpoint.borrow();
        connected_url(&endpoint.as_ref()?.home_relay_status().get())
    }

    /// Bind the endpoint and join the relay network, resolving once at
    /// least one relay handshake completes. This is a connection to the
    /// relay network, not to a peer.
    ///
    /// Rejects if binding fails, or if this relay is already connecting,
    /// connected, or closed — a relay is joined once, and a second
    /// membership means a second `Relay`.
    #[wasm_bindgen]
    pub fn connect(&self) -> js_sys::Promise {
        let state = Rc::clone(&self.state);

        wasm_bindgen_futures::future_to_promise(async move {
            match state.phase.get() {
                Phase::Defined => state.phase.set(Phase::Connecting),
                Phase::Connecting => {
                    return Err(JsError::new("this relay is already connecting").into());
                }
                Phase::Connected => {
                    return Err(JsError::new("this relay is already connected").into());
                }
                Phase::Closed => {
                    return Err(JsError::new("this relay has been closed").into());
                }
            }

            let endpoint = Endpoint::builder(presets::N0)
                .secret_key(state.identity.clone())
                .alpns(state.protocols.alpns())
                .bind()
                .await;

            let endpoint = match endpoint {
                Ok(endpoint) => endpoint,
                Err(err) => {
                    // Back to `Defined` rather than `Closed`: nothing was
                    // bound, so the host is free to try again.
                    state.phase.set(Phase::Defined);
                    return Err(JsError::new(&err.to_string()).into());
                }
            };

            // Started before the handshake is awaited so a peer that dials
            // the instant we're reachable is served, and so the first
            // connection change is one the host hears about. Scoped so the
            // borrow ends before the await below.
            {
                let mut tasks = state.tasks.borrow_mut();
                tasks.push(serve_inbound(&state, endpoint.clone()));

                // No watcher at all unless the host asked for one — the
                // `homeRelay` getter reads the endpoint directly.
                if let Some(on_change) = state.on_connection_change.clone() {
                    tasks.push(watch_home_relay(on_change, endpoint.clone()));
                }
            }

            *state.endpoint.borrow_mut() = Some(endpoint.clone());

            // Resolves once a relay server finishes its handshake — i.e.
            // we're reachable over the relay network.
            endpoint.online().await;
            state.phase.set(Phase::Connected);

            Ok(JsValue::UNDEFINED)
        })
    }

    /// Dial the peer named by `endpoint_id` on `protocol`, resolving with a
    /// live [`PeerConnection`] once it's established.
    ///
    /// `endpoint_id` is a base32 identity string as produced by
    /// [`Identity.endpointId`](crate::Identity::endpoint_id) — the value
    /// carried in a share link. `protocol` must be one this relay declared;
    /// dialling an undeclared one throws, since there'd be no message
    /// ceiling to read the answers under.
    ///
    /// Implemented as a sync fn returning a promise, rather than an `async
    /// fn`, so its future owns cloned state instead of borrowing this
    /// handle. An `async` method would hold that borrow for the whole dial,
    /// and the host freeing the relay mid-dial (navigating away) would then
    /// panic.
    #[wasm_bindgen]
    pub fn dial(&self, endpoint_id: String, protocol: String) -> js_sys::Promise {
        let state = Rc::clone(&self.state);

        wasm_bindgen_futures::future_to_promise(async move {
            let Some(protocol) = state.protocols.find(&protocol).cloned() else {
                return Err(JsError::new(&format!(
                    "protocol `{protocol}` was not declared when this relay was created"
                ))
                .into());
            };

            // Cloned out rather than held: the borrow must not span the
            // dial below.
            let endpoint = state.endpoint.borrow().clone();

            let Some(endpoint) = endpoint else {
                return Err(JsError::new("cannot dial before the relay is connected").into());
            };

            let endpoint_id: EndpointId = endpoint_id
                .parse()
                .map_err(|err: KeyParsingError| JsError::new(&err.to_string()))?;

            let connection = endpoint
                .connect(endpoint_id, &protocol.alpn())
                .await
                .map_err(|err| JsError::new(&err.to_string()))?;

            Ok(PeerConnection::new(connection, protocol).into())
        })
    }

    /// Leave the relay network, resolving once the endpoint has finished
    /// closing. Stops the accept loop and the connection watcher, and
    /// closes every peer connection this relay was still holding.
    ///
    /// Terminal: a closed relay can't be reconnected. Freeing the handle
    /// does the same thing without waiting for it to finish.
    #[wasm_bindgen]
    pub fn close(&self) -> js_sys::Promise {
        let state = Rc::clone(&self.state);

        wasm_bindgen_futures::future_to_promise(async move {
            state.phase.set(Phase::Closed);
            state.tasks.borrow_mut().clear();

            let endpoint = state.endpoint.borrow_mut().take();
            if let Some(endpoint) = endpoint {
                endpoint.close().await;
            }

            Ok(JsValue::UNDEFINED)
        })
    }
}

/// Read the protocol table out of the options bag. Every failure is
/// something the host wrote, so each one names the field it came from.
fn read_protocols(options: &RelayOptions) -> Result<ProtocolTable, JsError> {
    let protocols = js_sys::Reflect::get(options, &JsValue::from_str("protocols"))
        .map_err(|_| JsError::new("relay options must be an object"))?;

    let protocols: js_sys::Object = protocols
        .dyn_into()
        .map_err(|_| JsError::new("`protocols` must be an object keyed by protocol name"))?;

    let mut entries = Vec::new();

    for key in js_sys::Object::keys(&protocols) {
        let name = key
            .as_string()
            .ok_or_else(|| JsError::new("every protocol name must be a string"))?;

        let config = js_sys::Reflect::get(&protocols, &key)
            .map_err(|_| JsError::new(&format!("could not read protocol `{name}`")))?;

        let size = js_sys::Reflect::get(&config, &JsValue::from_str("maxMessageSize"))
            .ok()
            .and_then(|size| size.as_f64())
            .ok_or_else(|| {
                JsError::new(&format!(
                    "`maxMessageSize` for protocol `{name}` must be a number"
                ))
            })?;

        entries.push(Protocol::new(name, size).map_err(|err| JsError::new(&err.to_string()))?);
    }

    ProtocolTable::new(entries).map_err(|err| JsError::new(&err.to_string()))
}

/// Read the required peer handler out of the options bag.
fn read_peer_handler(options: &RelayOptions) -> Result<js_sys::Function, JsError> {
    js_sys::Reflect::get(options, &JsValue::from_str("onPeerConnection"))
        .ok()
        .and_then(|handler| handler.dyn_into::<js_sys::Function>().ok())
        .ok_or_else(|| JsError::new("`onPeerConnection` must be a function"))
}

/// Read the optional connection watcher out of the options bag.
///
/// Absent is fine; present-but-not-a-function is not. Silently ignoring the
/// latter would leave a host waiting on a watcher that never fires.
fn read_connection_handler(options: &RelayOptions) -> Result<Option<js_sys::Function>, JsError> {
    let handler = js_sys::Reflect::get(options, &JsValue::from_str("onConnectionChange"))
        .map_err(|_| JsError::new("relay options must be an object"))?;

    if handler.is_undefined() || handler.is_null() {
        return Ok(None);
    }

    handler
        .dyn_into::<js_sys::Function>()
        .map(Some)
        .map_err(|_| JsError::new("`onConnectionChange` must be a function"))
}

/// The URL of whichever relay server is currently connected. An endpoint
/// can be mid-handshake with several; only a connected one is an address
/// peers can actually reach us at.
fn connected_url(statuses: &[iroh::endpoint::RelayStatus]) -> Option<String> {
    statuses
        .iter()
        .find(|status| status.is_connected())
        .map(|status| status.url().to_string())
}

/// Serve inbound dials for as long as the relay is up.
///
/// A failed handshake is that peer's problem, and an ALPN we never
/// advertised shouldn't be reachable at all — both skip to the next
/// arrival rather than taking the loop down.
///
/// There is no "nobody is listening" case: the handler is settled when the
/// relay is defined, so by the time this loop can run there is always one.
fn serve_inbound(state: &Rc<RelayState>, endpoint: Endpoint) -> AbortOnDropHandle<()> {
    let protocols = state.protocols.clone();
    let on_peer = state.on_peer_connection.clone();

    AbortOnDropHandle::new(spawn(async move {
        while let Some(incoming) = endpoint.accept().await {
            let Ok(connection) = incoming.await else {
                continue;
            };

            let Some(protocol) = protocols.find_alpn(connection.alpn()) else {
                continue;
            };

            let name = JsValue::from_str(protocol.name());
            let peer = PeerConnection::new(connection, protocol.clone());

            let _ = on_peer.call2(&JsValue::NULL, &name, &JsValue::from(peer));
        }
    }))
}

/// Report relay connection changes to the host for as long as the relay is
/// up. iroh publishes home relay status as a watcher, so this is a genuine
/// stream of changes rather than a poll.
///
/// Only spawned when the host gave a handler, so an unwatched relay doesn't
/// pay for a stream nobody reads.
fn watch_home_relay(on_change: js_sys::Function, endpoint: Endpoint) -> AbortOnDropHandle<()> {
    AbortOnDropHandle::new(spawn(async move {
        let mut statuses = endpoint.home_relay_status().stream();

        while let Some(status) = statuses.next().await {
            let url = match connected_url(&status) {
                Some(url) => JsValue::from_str(&url),
                None => JsValue::UNDEFINED,
            };

            let _ = on_change.call1(&JsValue::NULL, &url);
        }
    }))
}
