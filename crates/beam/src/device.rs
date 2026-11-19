//! This device: its database, and its place on the network.
//!
//! The two share one key. Woodland keeps it in the store beside everything
//! it signed, and iroh binds under the same bytes, so a peer's address and
//! its identity in a group are one thing. A device that loses its store
//! comes back as someone else, on both layers at once.

use iroh::endpoint::presets;
use iroh::{SecretKey, Watcher};
use n0_future::StreamExt;
use n0_future::task::{AbortOnDropHandle, spawn};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;
use woodland::{BrowserStore, Database};

/// The ALPN two beam devices negotiate on. Versioned so a future format
/// can land without a device on the old one mistaking it for something it
/// can read.
const PROTOCOL: &[u8] = b"beam/1";

/// This device, open: a database over the browser's store, and an endpoint
/// bound under the database's key.
///
/// Opening doesn't wait for the network. Everything a device holds is
/// readable and writable offline; the relay comes and goes, and says so
/// through the handler given to [`Device::open`].
#[wasm_bindgen]
pub struct Device {
    /// `None` once closed. Taken rather than borrowed on the way out, so
    /// the store and its lock are let go before `close` resolves.
    database: RefCell<Option<Database<BrowserStore>>>,
    endpoint: iroh::Endpoint,
    // The home-relay watcher. An `AbortOnDropHandle`, so freeing the device
    // stops it.
    _relay: AbortOnDropHandle<()>,
}

#[wasm_bindgen]
impl Device {
    /// Open the device kept in the store called `store`, making it if it
    /// isn't there, and bind an endpoint under its key.
    ///
    /// `on_relay_change` is called with the home relay's URL whenever one
    /// connects, and with `undefined` when none is. It's given here rather
    /// than registered afterwards so the first connection is one the host
    /// hears about.
    ///
    /// Rejects if the browser won't open the store, if another tab or
    /// worker already has it open, or if the endpoint can't bind.
    pub async fn open(store: String, on_relay_change: js_sys::Function) -> Result<Device, JsError> {
        let store = BrowserStore::open(&store).await.map_err(to_js)?;

        // Fresh bytes every time. They're used only if the store is new;
        // after that the store's own key wins, and that's the one read
        // back below.
        let mut secret = [0; 32];
        getrandom::fill(&mut secret).map_err(to_js)?;
        let database = Database::open(store, secret).await.map_err(to_js)?;

        let endpoint = iroh::Endpoint::builder(presets::N0)
            .secret_key(SecretKey::from_bytes(&database.device_secret()))
            .alpns(vec![PROTOCOL.to_vec()])
            .bind()
            .await
            .map_err(to_js)?;

        Ok(Device {
            database: RefCell::new(Some(database)),
            _relay: watch_home_relay(on_relay_change, endpoint.clone()),
            endpoint,
        })
    }

    /// The address peers dial to reach this device, as a hex string. It is
    /// also the device's identity in every group it belongs to.
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.endpoint.id().to_string()
    }

    /// Leave the network and let go of the store, resolving once both are
    /// done. Closing tells connected peers it was deliberate, so they see
    /// this device go rather than waiting out a timeout.
    ///
    /// Terminal: open another `Device` to come back.
    pub async fn close(&self) {
        self.endpoint.close().await;
        drop(self.database.borrow_mut().take());
    }
}

/// An error as the host sees it: a JS `Error` carrying the message.
fn to_js(error: impl std::fmt::Display) -> JsError {
    JsError::new(&error.to_string())
}

/// Report relay connection changes to the host for as long as the device
/// is open. iroh publishes home relay status as a watcher, so this is a
/// genuine stream of changes rather than a poll.
fn watch_home_relay(
    on_change: js_sys::Function,
    endpoint: iroh::Endpoint,
) -> AbortOnDropHandle<()> {
    AbortOnDropHandle::new(spawn(async move {
        let mut statuses = endpoint.home_relay_status().stream();

        while let Some(statuses) = statuses.next().await {
            // An endpoint can be mid-handshake with several relays; only a
            // connected one is an address peers can reach this device at.
            let url = statuses
                .iter()
                .find(|status| status.is_connected())
                .map_or(JsValue::UNDEFINED, |status| {
                    JsValue::from_str(&status.url().to_string())
                });

            let _ = on_change.call1(&JsValue::NULL, &url);
        }
    }))
}
