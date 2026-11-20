//! This device: its database, and its place on the network.
//!
//! The two share one key. Woodland keeps it in the store beside everything
//! it signed, and iroh binds under the same bytes, so a peer's address and
//! its identity in a group are one thing. A device that loses its store
//! comes back as someone else, on both layers at once.

use std::cell::{Cell, RefCell};
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;

use iroh::endpoint::presets;
use iroh::{SecretKey, Watcher};
use n0_future::StreamExt;
use n0_future::task::{AbortOnDropHandle, spawn};
use wasm_bindgen::prelude::*;
use woodland::{GroupId, ImportId, StoreFault, Transaction};

use crate::core::{Core, Db, OpenError, PeerId, Token, has_role, open_database};
use crate::hex;
use crate::net;
use crate::schema::{Group, Member, Schema, Standing, item_key};

/// This device, open: a database over the browser's store, and an endpoint
/// bound under the database's key.
///
/// Opening doesn't wait for the network. Everything a device holds is
/// readable and writable offline; the relay comes and goes, and says so
/// through the handler given to [`Device::open`].
#[wasm_bindgen]
pub struct Device {
    core: Rc<Core>,
    /// Files being brought in, by the handle the host knows each by.
    imports: RefCell<BTreeMap<u32, ImportId>>,
    next_import: Cell<u32>,
    // The home-relay watcher, and the loops that answer peers, reach for
    // them, and let time pass. `AbortOnDropHandle`s, so freeing the device
    // stops them.
    _tasks: Vec<AbortOnDropHandle<()>>,
}

#[wasm_bindgen]
impl Device {
    /// Open the device kept in the store called `store`, making it if it
    /// isn't there, and bind an endpoint under its key.
    ///
    /// `on_relay_change` is called with the home relay's URL whenever one
    /// connects, and with `undefined` when none is. `on_change` is called
    /// with a group's id whenever something in that group may read
    /// differently. `on_fault` is called once, with why, if the store fails
    /// while open: nothing works after that until the device is opened
    /// again. All are given here rather than registered afterwards so
    /// nothing happens unheard.
    ///
    /// Rejects if the browser won't open the store, or if the endpoint
    /// can't bind. Two refusals are named, so the host can tell them from
    /// a store that's broken: the error's `name` is `StoreBusy` if another
    /// tab or worker has the store open, and `StoreMismatched` if what's
    /// kept under that name isn't a store this can open.
    pub async fn open(
        store: String,
        on_relay_change: js_sys::Function,
        on_change: js_sys::Function,
        on_fault: js_sys::Function,
    ) -> Result<Device, JsValue> {
        let (mut database, steps) = open_database(&store).await.map_err(refused)?;

        let endpoint = iroh::Endpoint::builder(presets::N0)
            .secret_key(SecretKey::from_bytes(&database.device_secret()))
            .alpns(vec![net::SYNC.to_vec(), net::LINK.to_vec()])
            .bind()
            .await
            .map_err(to_js)?;

        let id = database.id().to_bytes();
        let core = Rc::new(Core::new(id, endpoint.clone(), on_change, on_fault));
        core.remember_roles(&database);
        for outputs in steps {
            core.finish(&mut database, outputs).await.map_err(to_js)?;
        }

        // Whatever was committed since this device last shed its history.
        core.upkeep(&mut database).await;

        *core.database.lock().await = Some(database);

        let mut tasks = net::run(&core);
        tasks.push(watch_home_relay(on_relay_change, endpoint));

        Ok(Device {
            core,
            imports: RefCell::default(),
            next_import: Cell::new(0),
            _tasks: tasks,
        })
    }

    /// The address peers dial to reach this device, as a hex string. It is
    /// also the device's identity in every group it belongs to.
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        hex::encode(&self.core.id)
    }

    /// Leave the network and let go of the store, resolving once both are
    /// done. Closing tells connected peers it was deliberate, so they see
    /// this device go rather than waiting out a timeout.
    ///
    /// Terminal: open another `Device` to come back.
    pub async fn close(&self) {
        self.core.endpoint.close().await;
        drop(self.core.database.lock().await.take());
    }

    /// Found a group called `name` with this device as its only member,
    /// resolving with the group's id.
    ///
    /// The group is sealed: only devices given a role that reads can read
    /// it, whoever else ends up carrying it.
    #[wasm_bindgen(js_name = createGroup)]
    pub async fn create_group(&self, name: String) -> Result<String, JsError> {
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        let founded = database.found_sealed(random()?).await;
        let (group, outputs) = founded.map_err(to_js)?;
        self.core.finish(database, outputs).await.map_err(to_js)?;

        let founding = Schema::of(group, group).found(&name);
        self.write(database, group, founding).await?;

        Ok(hex::encode(group.as_bytes()))
    }

    /// Every group this device holds and hasn't put behind it, as
    /// `{ id, name, member, deviceName }`, in id order.
    pub async fn groups(&self) -> Result<JsValue, JsError> {
        let database = self.core.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;
        let me = self.core.id;

        // A group that another was founded to carry on from is still
        // held, and is no longer where anything happens.
        let held: Vec<GroupId> = database.groups().collect();
        let succeeded = held.iter().filter_map(|&group| database.succeeds(group));
        let succeeded: BTreeSet<GroupId> = succeeded.collect();

        let mut groups: Vec<Group> = Vec::new();
        for group in held {
            let schema = Self::schema(database, group).await?;
            let closed = database.read(&schema.closed_query()).await;
            if succeeded.contains(&group) || !closed.map_err(to_js)?.found().is_empty() {
                continue;
            }

            let name = database.read(&schema.name_query()).await;
            let names = database.read(&schema.devices_query()).await;
            let mut names = Schema::device_names(names.map_err(to_js)?.into_found());

            // Holding a group isn't being in it. A device that was just
            // let in carries the group until a checkpoint gives it a role.
            let standing = Standing {
                member: has_role(database, group, &me) && database.reads(group),
                device_name: names.remove(&me[..]).unwrap_or_default(),
            };

            groups.push(schema.group(name.map_err(to_js)?.into_found(), standing));
        }

        serde_wasm_bindgen::to_value(&groups).map_err(to_js)
    }

    /// The devices with a role in `group`, as `{ id, name, me, online }`,
    /// in id order.
    pub async fn members(&self, group: String) -> Result<JsValue, JsError> {
        let group = group_id(&group)?;
        let database = self.core.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;

        let schema = Self::schema(database, group).await?;
        let names = database.read(&schema.devices_query()).await;
        let mut names = Schema::device_names(names.map_err(to_js)?.into_found());

        let roles = database.configuration(group).map(|it| it.roles);
        let members = roles.into_iter().flatten().map(|(peer, _)| {
            let id = peer.to_bytes();
            let me = id == self.core.id;

            Member {
                id: hex::encode(&id),
                name: names.remove(&id[..]).unwrap_or_default(),
                me,
                online: me || self.core.is_connected(&id),
            }
        });

        let members: Vec<Member> = members.collect();
        serde_wasm_bindgen::to_value(&members).map_err(to_js)
    }

    /// Say what this device is called in `group`.
    #[wasm_bindgen(js_name = setDeviceName)]
    pub async fn set_device_name(&self, group: String, name: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;
        let schema = Self::schema(database, group).await?;
        let named = schema.name_device(self.core.id, &name);

        self.write(database, group, named).await
    }

    /// Call `group` something else, for every device in it.
    #[wasm_bindgen(js_name = renameGroup)]
    pub async fn rename_group(&self, group: String, name: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        let renamed = Self::schema(database, group).await?.rename(&name);

        self.write(database, group, renamed).await
    }

    /// Ask `group` to remove `device`. A device that learns it was removed
    /// forgets the group and everything shared to it.
    ///
    /// It happens when the group agrees:
    /// with equal weights, once most of its devices have been reachable,
    /// the one being removed among those counted.
    #[wasm_bindgen(js_name = removeDevice)]
    pub async fn remove_device(&self, group: String, device: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let device = hex::decode_array::<32>(&device);
        let device = device.ok_or_else(|| JsError::new("not a device id"))?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        self.without(database, group, device).await
    }

    /// Be done with `group`.
    ///
    /// A device with no role in it forgets it at once. One with a role
    /// asks to be removed, and forgets the group when it has been: a
    /// member has signed things it can't walk away from. The last member
    /// can't be removed, so it closes the group, which hides it.
    #[wasm_bindgen(js_name = leaveGroup)]
    pub async fn leave_group(&self, group: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        let roles = database.configuration(group).map(|it| it.roles.len());
        let alone = roles.unwrap_or_default() <= 1;
        if alone && has_role(database, group, &self.core.id) {
            let closed = Self::schema(database, group).await?.close();
            return self.write(database, group, closed).await;
        }

        self.core.depart(database, group).await.map_err(to_js)
    }

    /// Start `group` over as a new group with only this device in it,
    /// resolving with the new group's id. Everything the old group had
    /// committed comes with it; other devices have to be linked again.
    ///
    /// For a group that has lost, for good, the devices it takes to
    /// agree on anything. Nothing can tell gone from away, so this is a
    /// person's decision.
    #[wasm_bindgen(js_name = replaceGroup)]
    pub async fn replace_group(&self, group: String) -> Result<String, JsError> {
        let old = group_id(&group)?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        // Read before the new group exists: it's the old group that knows.
        let origin = Self::origin(database, old).await?;

        let (new, outputs) = database.succeed(old, random()?).await.map_err(to_js)?;
        self.core.finish(database, outputs).await.map_err(to_js)?;

        // What it inherited is still under the ids the first group gave
        // it. Whoever joins the new group has only its id to go on, so the
        // new group says where its line began.
        let rooted = Schema::of(new, origin).record_origin(origin);
        self.write(database, new, rooted).await?;

        Ok(hex::encode(new.as_bytes()))
    }

    /// Everything shared to `group`, oldest first, as
    /// `{ id, body, author, createdAt, committed }`.
    ///
    /// Reads what this device knows right now, its own unsynced writes
    /// included. `committed` says which of it the group has made final.
    pub async fn items(&self, group: String) -> Result<JsValue, JsError> {
        let group = group_id(&group)?;
        let database = self.core.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;
        let schema = Self::schema(database, group).await?;

        let shown = database.read(&schema.items_query()).await;
        let committed = database.read(&schema.items_query().committed()).await;
        let mut items = schema.items(
            shown.map_err(to_js)?.found(),
            committed.map_err(to_js)?.found(),
        );

        for item in &mut items {
            if let Some(blob) = item.blob() {
                item.hold(database.blob_held(&blob).await.map_err(to_js)?);
            }
        }

        serde_wasm_bindgen::to_value(&items).map_err(to_js)
    }

    /// Share `body` to `group`. It shows here at once, and reaches the
    /// group's other devices as they're reachable.
    #[wasm_bindgen(js_name = addItem)]
    pub async fn add_item(&self, group: String, body: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        #[expect(
            clippy::cast_possible_truncation,
            reason = "milliseconds since 1970, a whole number well inside an i64"
        )]
        let now = js_sys::Date::now() as i64;
        let key = item_key(now, random()?);
        let schema = Self::schema(database, group).await?;
        let add = schema.add(key, body, self.core.id, now);

        self.write(database, group, add).await
    }

    /// Delete `item` from `group`, for every device. Deleting one that's
    /// already gone does nothing.
    #[wasm_bindgen(js_name = deleteItem)]
    pub async fn delete_item(&self, group: String, item: String) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let key = hex::decode(&item).ok_or_else(|| JsError::new("not an item id"))?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;
        let schema = Self::schema(database, group).await?;

        let answer = database.read(&schema.item_query(&key)).await;
        let delete = schema.delete(answer.map_err(to_js)?.found(), &key);

        match delete {
            Some(delete) => self.write(database, group, delete).await,
            None => Ok(()),
        }
    }

    /// Start bringing a file in, resolving with a handle to
    /// [write](Self::write_file) its bytes to.
    ///
    /// Nothing is shared until [`Self::finish_file`]. A file that won't
    /// be finished should be [abandoned](Self::abandon_file), or its bytes
    /// stay until the device next opens.
    #[wasm_bindgen(js_name = beginFile)]
    pub async fn begin_file(&self) -> Result<u32, JsError> {
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        // Encrypted under a key of its own, which travels in the item
        // that refers to it: whoever can read the group can read the file.
        let begun = database.begin_sealed_import(random()?).await;
        let (import, outputs) = begun.map_err(to_js)?;
        self.core.finish(database, outputs).await.map_err(to_js)?;

        let handle = self.next_import.get();
        self.next_import.set(handle.wrapping_add(1));
        self.imports.borrow_mut().insert(handle, import);

        Ok(handle)
    }

    /// Take in the next bytes of a file, in order. Any amount at a time.
    #[wasm_bindgen(js_name = writeFile)]
    pub async fn write_file(&self, file: u32, bytes: Vec<u8>) -> Result<(), JsError> {
        let import = self.import(file)?;
        let mut rest = &bytes[..];

        while !rest.is_empty() {
            // The lock is taken for each step, not the whole write, so a
            // large file doesn't keep sync waiting.
            let mut database = self.core.database.lock().await;
            let database = database.as_mut().ok_or_else(closed)?;

            let (taken, outputs) = database.import(import, rest).await.map_err(to_js)?;
            self.core.finish(database, outputs).await.map_err(to_js)?;
            rest = &rest[taken..];
        }

        Ok(())
    }

    /// Share a file whose bytes are all in to `group`, as `name` and of
    /// media type `kind`.
    #[wasm_bindgen(js_name = finishFile)]
    pub async fn finish_file(
        &self,
        group: String,
        file: u32,
        name: String,
        kind: String,
    ) -> Result<(), JsError> {
        let group = group_id(&group)?;
        let import = self.import(file)?;
        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;

        let (blob, outputs) = database.finish_import(import).await.map_err(to_js)?;
        self.core.finish(database, outputs).await.map_err(to_js)?;

        #[expect(
            clippy::cast_possible_truncation,
            reason = "milliseconds since 1970, a whole number well inside an i64"
        )]
        let now = js_sys::Date::now() as i64;
        let key = item_key(now, random()?);
        let schema = Self::schema(database, group).await?;
        let add = schema.add_file(key, (blob, name, kind), self.core.id, now);

        // The item refers to the bytes from here, and the import is done.
        self.write(database, group, add).await?;
        self.imports.borrow_mut().remove(&file);

        Ok(())
    }

    /// Give up on a file that was begun, and let its bytes go.
    #[wasm_bindgen(js_name = abandonFile)]
    pub async fn abandon_file(&self, file: u32) -> Result<(), JsError> {
        let Some(import) = self.imports.borrow_mut().remove(&file) else {
            return Ok(());
        };

        let mut database = self.core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;
        let outputs = database.abandon_import(import).await.map_err(to_js)?;

        self.core.finish(database, outputs).await.map_err(to_js)
    }

    /// Read a file's bytes from `offset`: as many as one step gives, and
    /// fewer at its end, and none past it. Nothing if `item` isn't a file,
    /// or this device doesn't hold that part of it yet.
    #[wasm_bindgen(js_name = readFile)]
    pub async fn read_file(
        &self,
        group: String,
        item: String,
        offset: f64,
    ) -> Result<Option<Vec<u8>>, JsError> {
        let group = group_id(&group)?;
        let key = hex::decode(&item).ok_or_else(|| JsError::new("not an item id"))?;
        let database = self.core.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;
        let schema = Self::schema(database, group).await?;

        let answer = database.read(&schema.item_query(&key)).await;
        let Some(blob) = schema.blob(answer.map_err(to_js)?.found(), &key) else {
            return Ok(None);
        };

        #[expect(
            clippy::cast_possible_truncation,
            clippy::cast_sign_loss,
            reason = "a whole, non-negative offset from the host"
        )]
        let offset = offset.max(0.0) as u64;
        let bytes = database.read_blob(&blob, offset, Db::BLOB_STEP).await;

        bytes.map_err(to_js)
    }

    /// Make an invitation to `group`: a code for one other device to
    /// [join](Self::join) with, once, in the next ten minutes, while this
    /// device stays open and online.
    ///
    /// The code names this device and carries a secret. Whoever holds it
    /// can be let into the group, so show it only to the device meant to
    /// have it. The other device dials this one and presents the secret;
    /// this one never dials out for an invitation.
    pub fn invite(&self, group: String) -> Result<String, JsError> {
        let group = group_id(&group)?;
        let token: Token = random()?;
        self.core.invite(token, group);

        Ok(hex::encode(&[&self.core.id[..], &token].concat()))
    }

    /// Use another device's invitation, resolving with the group's id.
    ///
    /// Rejects with `left-behind` if this device was still in a group the
    /// invitation's group replaced. It has left that group by then, and
    /// the invitation is unspent: open the device again and use it again.
    ///
    /// Needs the inviting device reachable right now. This device holds
    /// the group at once; it can read and write it when the group gives it
    /// a role, which the group list's `member` reports.
    pub async fn join(&self, code: String) -> Result<String, JsError> {
        let invite = parse_invite(&code);
        let (inviter, token) = invite.ok_or_else(|| JsError::new("not an invitation"))?;

        if inviter == self.core.id {
            return Err(JsError::new("this device made that invitation"));
        }

        let group = net::join(&self.core, inviter, token).await?;

        Ok(hex::encode(group.as_bytes()))
    }
}

impl Device {
    /// The import behind a handle [`Self::begin_file`] gave.
    fn import(&self, file: u32) -> Result<ImportId, JsError> {
        let import = self.imports.borrow().get(&file).copied();

        import.ok_or_else(|| JsError::new("no such file being brought in"))
    }

    /// The group `group`'s line began with: itself, unless it was founded
    /// to carry on from another.
    ///
    /// A group that carries on says so where its own id finds it. A device
    /// that held the group before it may not have been handed that yet,
    /// and has the older group to ask instead.
    async fn origin(database: &Db, group: GroupId) -> Result<GroupId, JsError> {
        let mut at = group;

        loop {
            let recorded = database.read(&Schema::origin_query(at)).await;
            let recorded = recorded.map_err(to_js)?;
            if !recorded.found().is_empty() {
                return Ok(Schema::origin(at, recorded.found()));
            }

            let before = database.succeeds(at);
            let held = before.filter(|old| database.groups().any(|it| it == *old));
            let Some(before) = held else {
                return Ok(at);
            };

            at = before;
        }
    }

    /// Where `group` keeps what it holds.
    async fn schema(database: &Db, group: GroupId) -> Result<Schema, JsError> {
        Ok(Schema::of(group, Self::origin(database, group).await?))
    }

    /// Ask `group` to carry on without `device`.
    async fn without(
        &self,
        database: &mut Db,
        group: GroupId,
        device: PeerId,
    ) -> Result<(), JsError> {
        let configuration = database.configuration(group);
        let configuration = configuration.ok_or_else(|| JsError::new("no such group"))?;

        // Everyone the group has now, but for the one.
        let mut roles = configuration.roles;
        roles.retain(|(peer, _)| peer.to_bytes() != device);

        let asked = database.reconfigure(group, roles).await.map_err(to_js)?;
        let settled = self.core.finish_in(database, group, asked).await;

        settled.map_err(to_js)
    }

    /// Write to `group`, and attempt a checkpoint so a lone device commits
    /// it at once.
    async fn write(
        &self,
        database: &mut Db,
        group: GroupId,
        transaction: Transaction,
    ) -> Result<(), JsError> {
        let written = self.core.check(database.write(group, transaction).await);
        let outputs = written.map_err(to_js)?;
        let settled = self.core.finish_in(database, group, outputs).await;

        settled.map_err(to_js)
    }
}

/// An invitation code, back as who made it and its secret.
fn parse_invite(code: &str) -> Option<(PeerId, Token)> {
    let bytes = hex::decode_array::<48>(code)?;
    let (inviter, token) = bytes.split_first_chunk::<32>()?;

    Some((*inviter, token.try_into().ok()?))
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

/// A failed open as the host sees it: a JS `Error` carrying the reason,
/// named for what the store said was wrong when it said.
fn refused(error: OpenError) -> JsValue {
    let refusal = js_sys::Error::new(&error.reason);
    match error.fault {
        Some(StoreFault::Busy) => refusal.set_name("StoreBusy"),
        Some(StoreFault::Mismatched) => refusal.set_name("StoreMismatched"),
        _ => {}
    }

    refusal.into()
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
