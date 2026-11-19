//! This device: its database, and its place on the network.
//!
//! The two share one key. Woodland keeps it in the store beside everything
//! it signed, and iroh binds under the same bytes, so a peer's address and
//! its identity in a group are one thing. A device that loses its store
//! comes back as someone else, on both layers at once.

use std::collections::BTreeSet;

use iroh::endpoint::presets;
use iroh::{SecretKey, Watcher};
use n0_future::StreamExt;
use n0_future::task::{AbortOnDropHandle, spawn};
use tokio::sync::Mutex;
use wasm_bindgen::prelude::*;
use woodland::{BlobPolicy, BrowserStore, Changed, Database, Error, GroupId, Outputs, Transaction};

use crate::hex;
use crate::schema::{Group, Schema, item_key};

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
    /// `None` once closed.
    ///
    /// Behind a lock because the database is a state machine that takes
    /// one step at a time, and the host doesn't wait for one call to
    /// settle before making the next. Whoever holds the lock is the step.
    database: Mutex<Option<Database<BrowserStore>>>,
    /// The key peers know this device by, and items name as their author.
    id: [u8; 32],
    endpoint: iroh::Endpoint,
    /// Called with a group's id whenever something in it may read
    /// differently.
    on_change: js_sys::Function,
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
    /// connects, and with `undefined` when none is. `on_change` is called
    /// with a group's id whenever something in that group may read
    /// differently. Both are given here rather than registered afterwards
    /// so nothing happens unheard.
    ///
    /// Rejects if the browser won't open the store, if another tab or
    /// worker already has it open, or if the endpoint can't bind.
    pub async fn open(
        store: String,
        on_relay_change: js_sys::Function,
        on_change: js_sys::Function,
    ) -> Result<Device, JsError> {
        let store = BrowserStore::open(&store).await.map_err(to_js)?;

        // Fresh bytes every time. They're used only if the store is new;
        // after that the store's own key wins, and that's the one read
        // back below.
        let mut database = Database::open(store, random()?).await.map_err(to_js)?;

        // Said on every start, since there's no default and no group can
        // be held until it is. This device keeps whatever its groups share.
        let outputs = database.set_blob_policy(BlobPolicy::All).await;
        let outputs = outputs.map_err(to_js)?;

        let endpoint = iroh::Endpoint::builder(presets::N0)
            .secret_key(SecretKey::from_bytes(&database.device_secret()))
            .alpns(vec![PROTOCOL.to_vec()])
            .bind()
            .await
            .map_err(to_js)?;

        let device = Device {
            id: database.id().to_bytes(),
            database: Mutex::new(None),
            _relay: watch_home_relay(on_relay_change, endpoint.clone()),
            endpoint,
            on_change,
        };

        let changed = device.settle(&mut database, outputs).await;
        *device.database.lock().await = Some(database);
        device.announce(changed.map_err(to_js)?);

        Ok(device)
    }

    /// The address peers dial to reach this device, as a hex string. It is
    /// also the device's identity in every group it belongs to.
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        hex::encode(&self.id)
    }

    /// Leave the network and let go of the store, resolving once both are
    /// done. Closing tells connected peers it was deliberate, so they see
    /// this device go rather than waiting out a timeout.
    ///
    /// Terminal: open another `Device` to come back.
    pub async fn close(&self) {
        self.endpoint.close().await;
        drop(self.database.lock().await.take());
    }

    /// Found a group called `name` with this device as its only member,
    /// resolving with the group's id.
    ///
    /// The group is sealed: only devices given a role that reads can read
    /// it, whoever else ends up carrying it.
    #[wasm_bindgen(js_name = createGroup)]
    pub async fn create_group(&self, name: String) -> Result<String, JsError> {
        let mut database = self.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        let founded = database.found_sealed(random()?).await;
        let (group, outputs) = founded.map_err(to_js)?;
        let mut changed = self.settle(database, outputs).await.map_err(to_js)?;

        let founding = Schema::of(group).found(&name);
        changed.append(&mut self.write(database, group, founding).await?);
        self.announce(changed);

        Ok(hex::encode(group.as_bytes()))
    }

    /// Every group this device holds, as `{ id, name }`, in id order.
    pub async fn groups(&self) -> Result<JsValue, JsError> {
        let database = self.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;

        let mut groups: Vec<Group> = Vec::new();
        for group in database.groups() {
            let schema = Schema::of(group);
            let answer = database.read(&schema.name_query()).await;
            groups.push(schema.group(answer.map_err(to_js)?.into_found()));
        }

        serde_wasm_bindgen::to_value(&groups).map_err(to_js)
    }

    /// Everything shared to `group`, oldest first, as
    /// `{ id, body, author, createdAt }`.
    ///
    /// Reads what this device knows right now, its own unsynced writes
    /// included.
    pub async fn items(&self, group: String) -> Result<JsValue, JsError> {
        let schema = Schema::of(group_id(&group)?);
        let database = self.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;

        let answer = database.read(&schema.items_query()).await;
        let items = schema.items(answer.map_err(to_js)?.found());

        serde_wasm_bindgen::to_value(&items).map_err(to_js)
    }

    /// Share `body` to `group`. It shows here at once, and reaches the
    /// group's other devices as they're reachable.
    #[wasm_bindgen(js_name = addItem)]
    pub async fn add_item(&self, group: String, body: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let mut database = self.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        #[expect(
            clippy::cast_possible_truncation,
            reason = "milliseconds since 1970, a whole number well inside an i64"
        )]
        let now = js_sys::Date::now() as i64;
        let key = item_key(now, random()?);
        let add = Schema::of(group).add(key, body, self.id, now);

        let changed = self.write(database, group, add).await?;
        self.announce(changed);

        Ok(())
    }

    /// Delete `item` from `group`, for every device. Deleting one that's
    /// already gone does nothing.
    #[wasm_bindgen(js_name = deleteItem)]
    pub async fn delete_item(&self, group: String, item: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let key = hex::decode(&item).ok_or_else(|| JsError::new("not an item id"))?;
        let schema = Schema::of(group);
        let mut database = self.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        let answer = database.read(&schema.item_query(&key)).await;
        let delete = schema.delete(answer.map_err(to_js)?.found(), &key);

        if let Some(delete) = delete {
            let changed = self.write(database, group, delete).await?;
            self.announce(changed);
        }

        Ok(())
    }
}

impl Device {
    /// Write to `group`, then let time pass.
    ///
    /// A write is provisional until a checkpoint commits it, and a device
    /// attempts one when told time has passed. A device that is its
    /// group's whole quorum commits on its own tick, so ticking here means
    /// nothing a lone device writes is ever left provisional.
    async fn write(
        &self,
        database: &mut Database<BrowserStore>,
        group: GroupId,
        transaction: Transaction,
    ) -> Result<BTreeSet<GroupId>, JsError> {
        let outputs = database.write(group, transaction).await.map_err(to_js)?;
        let mut changed = self.settle(database, outputs).await.map_err(to_js)?;

        let outputs = database.tick().await.map_err(to_js)?;
        changed.append(&mut self.settle(database, outputs).await.map_err(to_js)?);

        Ok(changed)
    }

    /// Do what a step asked for, and every step that follows from it,
    /// returning the groups in which something may read differently.
    ///
    /// Nothing is sent yet: no device has anyone to send to.
    async fn settle(
        &self,
        database: &mut Database<BrowserStore>,
        mut outputs: Outputs,
    ) -> Result<BTreeSet<GroupId>, Error> {
        let mut changed = BTreeSet::new();

        loop {
            changed.extend(outputs.changed.iter().filter_map(group_of));

            if !outputs.unfinished {
                return Ok(changed);
            }

            outputs = database.resume().await?;
        }
    }

    /// Tell the host which groups to read again. A handler that throws is
    /// the host's problem, not the step's: the step is already durable.
    fn announce(&self, changed: BTreeSet<GroupId>) {
        for group in changed {
            let group = JsValue::from_str(&hex::encode(group.as_bytes()));
            let _ = self.on_change.call1(&JsValue::NULL, &group);
        }
    }
}

/// The group a change is to. A blob's bytes belong to no one group.
fn group_of(change: &Changed) -> Option<GroupId> {
    match change {
        Changed::Key { group, .. }
        | Changed::Pending { group, .. }
        | Changed::Indexed { group, .. }
        | Changed::Members { group }
        | Changed::Checkpoint { group, .. }
        | Changed::Everything { group } => Some(*group),
        Changed::Blob { .. } => None,
    }
}

/// A group id as the host gave it, back as the database's.
fn group_id(group: &str) -> Result<GroupId, JsError> {
    let bytes = hex::decode_array(group).ok_or_else(|| JsError::new("not a group id"))?;

    Ok(GroupId::from_bytes(bytes))
}

/// Fresh random bytes, from the browser's crypto API.
fn random<const N: usize>() -> Result<[u8; N], JsError> {
    let mut bytes = [0; N];
    getrandom::fill(&mut bytes).map_err(to_js)?;

    Ok(bytes)
}

/// What a call on a closed device rejects with.
fn closed() -> JsError {
    JsError::new("the device is closed")
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
