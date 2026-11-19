//! What a beam group holds, and where.
//!
//! Every device derives these ids alike, from constants: that's how two
//! devices agree on where the items are without talking. Nothing here is
//! created twice. The founder creates the tables in the transaction that
//! names the group, and everyone else finds them there.
//!
//! A model's id is made from a group's id, and a group founded to carry on
//! from another keeps the models it inherited under the ids they had. So
//! the ids come from the group the line began with, its *origin*, which
//! every group after the first records where its own id can find it.

use std::collections::{BTreeMap, BTreeSet};

use serde::Serialize;
use woodland::{BlobRef, ColumnId, GroupId, ModelId, Query, Row, Table, Transaction, Value};

use crate::hex;

/// The name every device derives a model or column id from.
const fn nonce(name: &[u8]) -> [u8; 32] {
    let mut nonce = [0; 32];
    let mut at = 0;
    while at < name.len() {
        nonce[at] = name[at];
        at += 1;
    }

    nonce
}

/// The key the group's name is kept under, in its [`Schema::meta`].
const NAME: &[u8] = b"name";

/// The key that says a group is closed, in its [`Schema::meta`]: its last
/// member is done with it. Present is closed, whatever it holds.
const CLOSED: &[u8] = b"closed";

/// The key a group's origin is kept under, in [`Schema::origin_model`].
const ORIGIN: &[u8] = b"origin";

/// The models of one group, and the columns of its tables.
#[derive(Clone, Copy)]
pub(crate) struct Schema {
    group: GroupId,
    /// What the group says about itself: a map, last write wins.
    meta: ModelId,
    /// What each device is called, by its id. A device writes its own.
    devices: ModelId,
    /// What's been shared, a row each. Keyed so that key order is the
    /// order they were written in: see [`item_key`].
    items: ModelId,
    body: ColumnId,
    author: ColumnId,
    created: ColumnId,
    /// A file's bytes, for an item that is one. A reference describes
    /// nothing, so what the file is called and what it is sit beside it.
    file: ColumnId,
    file_name: ColumnId,
    file_type: ColumnId,
}

/// A group as the host lists it.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Group {
    id: String,
    name: String,
    /// Whether this device has a role in the group and can read it. A
    /// device that was just let in holds the group before it's in it.
    member: bool,
    /// What this device is called in the group. Empty until it has said.
    device_name: String,
}

/// What a group's own devices know about it, beyond its name.
pub(crate) struct Standing {
    pub(crate) member: bool,
    pub(crate) device_name: String,
}

/// A device with a role in a group.
#[derive(Serialize)]
pub(crate) struct Member {
    /// The device's id. Hex.
    pub(crate) id: String,
    /// What it calls itself. Empty until it has said.
    pub(crate) name: String,
    /// Whether it's this device.
    pub(crate) me: bool,
    /// Whether it's reachable right now. This device always is.
    pub(crate) online: bool,
}

/// Something shared to a group.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Item {
    id: String,
    body: String,
    /// The device that wrote it, as that device says. Hex.
    author: String,
    /// When it was written, by its author's clock. Milliseconds.
    created_at: f64,
    /// Whether the group has made it final. Until then it's this device's
    /// word for it: shown, shared as peers are reachable, and not yet
    /// agreed.
    committed: bool,
    /// The file, for an item that is one. Its body is empty.
    file: Option<File>,
    /// Where the file's bytes are. Not the host's business: it carries the
    /// key they're encrypted under.
    #[serde(skip)]
    blob: Option<BlobRef>,
}

/// A file shared to a group, as the host shows it.
#[derive(Serialize)]
pub(crate) struct File {
    /// What its author's device called it. Another device's word: show
    /// it, and don't trust it as a path.
    name: String,
    /// Its media type, as its author's device guessed. May be empty.
    #[serde(rename = "type")]
    kind: String,
    /// How many bytes it is.
    size: f64,
    /// How many of them this device holds. All of them, once it's here.
    held: f64,
}

impl Item {
    /// Where the item's file is kept, if it is one.
    pub(crate) fn blob(&self) -> Option<BlobRef> {
        self.blob
    }

    /// Say how much of the item's file this device holds.
    #[expect(
        clippy::cast_precision_loss,
        reason = "a file's length fits a double far past any file"
    )]
    pub(crate) fn hold(&mut self, held: u64) {
        if let Some(file) = &mut self.file {
            file.held = held as f64;
        }
    }
}

impl Schema {
    /// The schema of `group`, whose line began with `origin`: itself, for
    /// a group that was founded and not carried on from another.
    pub(crate) fn of(group: GroupId, origin: GroupId) -> Self {
        let items = ModelId::table(origin, nonce(b"beam/items"));

        Self {
            group,
            meta: ModelId::kv(origin, nonce(b"beam/meta")),
            devices: ModelId::kv(origin, nonce(b"beam/devices")),
            items,
            body: ColumnId::text(items, nonce(b"body")),
            author: ColumnId::bytes(items, nonce(b"author")),
            created: ColumnId::integer(items, nonce(b"created")),
            file: ColumnId::blob(items, nonce(b"file")),
            file_name: ColumnId::text(items, nonce(b"file_name")),
            file_type: ColumnId::text(items, nonce(b"file_type")),
        }
    }

    /// Where a group says which group its line began with. The one model
    /// whose id is made from the group's own, so it can be found knowing
    /// nothing else. A group that began its own line has nothing in it.
    fn origin_model(group: GroupId) -> ModelId {
        ModelId::kv(group, nonce(b"beam/origin"))
    }

    /// Finds the origin of `group`, if it isn't its own.
    pub(crate) fn origin_query(group: GroupId) -> Query {
        Query::key(group, Self::origin_model(group), ORIGIN)
    }

    /// The origin in the answer to [`Self::origin_query`]: `group` itself
    /// if there's none recorded.
    pub(crate) fn origin(group: GroupId, found: &[(Vec<u8>, Vec<u8>)]) -> GroupId {
        let recorded = found
            .first()
            .and_then(|(_, origin)| origin[..].try_into().ok());

        recorded.map_or(group, GroupId::from_bytes)
    }

    /// Records, in `group`, the origin this schema was made with.
    pub(crate) fn record_origin(&self, origin: GroupId) -> Transaction {
        let model = Self::origin_model(self.group);

        Transaction::new().set(model, ORIGIN, origin.as_bytes().to_vec())
    }

    /// What a founder writes first: the tables, and the group's name.
    pub(crate) fn found(&self, name: &str) -> Transaction {
        let columns = [
            (self.body, "body"),
            (self.author, "author"),
            (self.created, "created"),
            (self.file, "file"),
            (self.file_name, "file_name"),
            (self.file_type, "file_type"),
        ];

        Transaction::new()
            .create_table(self.items, columns)
            .rename_table(self.items, "items")
            .set(self.meta, NAME, name)
    }

    pub(crate) fn name_query(&self) -> Query {
        Query::key(self.group, self.meta, NAME)
    }

    /// The group as the host lists it, from the answer to
    /// [`Self::name_query`]. A group this device can't read has no name.
    pub(crate) fn group(&self, found: Vec<(Vec<u8>, Vec<u8>)>, standing: Standing) -> Group {
        let name = found.into_iter().next();
        let name = name.map(|(_, value)| String::from_utf8_lossy(&value).into_owned());

        Group {
            id: hex::encode(self.group.as_bytes()),
            name: name.unwrap_or_default(),
            member: standing.member,
            device_name: standing.device_name,
        }
    }

    /// Calls the group something else.
    pub(crate) fn rename(&self, name: &str) -> Transaction {
        Transaction::new().set(self.meta, NAME, name)
    }

    /// Finds anything if the group is closed.
    pub(crate) fn closed_query(&self) -> Query {
        Query::key(self.group, self.meta, CLOSED)
    }

    /// Closes the group: its last member is done with it.
    pub(crate) fn close(&self) -> Transaction {
        Transaction::new().set(self.meta, CLOSED, "1")
    }

    /// What every device in the group is called.
    pub(crate) fn devices_query(&self) -> Query {
        Query::prefix(self.group, self.devices, &[])
    }

    /// The answer to [`Self::devices_query`], by device id.
    pub(crate) fn device_names(found: Vec<(Vec<u8>, Vec<u8>)>) -> BTreeMap<Vec<u8>, String> {
        let named = found.into_iter();
        let named = named.map(|(id, name)| (id, String::from_utf8_lossy(&name).into_owned()));

        named.collect()
    }

    /// Says what `device` is called.
    pub(crate) fn name_device(&self, device: [u8; 32], name: &str) -> Transaction {
        Transaction::new().set(self.devices, device, name)
    }

    pub(crate) fn items_query(&self) -> Query {
        Query::table(self.group, self.items)
    }

    pub(crate) fn item_query(&self, key: &[u8]) -> Query {
        Query::row(self.group, self.items, key)
    }

    /// Every item in the answer to [`Self::items_query`], oldest first,
    /// marked by whether the committed answer to the same query has it.
    pub(crate) fn items(
        &self,
        shown: &[(Vec<u8>, Vec<u8>)],
        committed: &[(Vec<u8>, Vec<u8>)],
    ) -> Vec<Item> {
        let committed = Table::read(committed);
        let committed = committed.iter().flat_map(Table::rows).map(Row::key);
        let committed: BTreeSet<&[u8]> = committed.collect();

        let table = Table::read(shown);
        let rows = table.iter().flat_map(Table::rows);

        rows.map(|row| self.item(row, committed.contains(row.key())))
            .collect()
    }

    fn item(&self, row: &Row, committed: bool) -> Item {
        let body = match row.get(self.body) {
            Value::Text(body) => body.clone(),
            _ => String::new(),
        };
        let author = match row.get(self.author) {
            Value::Bytes(author) => hex::encode(author),
            _ => String::new(),
        };
        #[expect(
            clippy::cast_precision_loss,
            reason = "milliseconds since 1970 fit a double for the next 285,000 years"
        )]
        let created_at = match row.get(self.created) {
            Value::Integer(created) => *created as f64,
            _ => 0.0,
        };

        let blob = match row.get(self.file) {
            Value::Blob(blob) => Some(*blob),
            _ => None,
        };

        Item {
            id: hex::encode(row.key()),
            body,
            author,
            created_at,
            committed,
            file: blob.map(|blob| self.file_of(row, &blob)),
            blob,
        }
    }

    #[expect(
        clippy::cast_precision_loss,
        reason = "a file's length fits a double far past any file"
    )]
    fn file_of(&self, row: &Row, blob: &BlobRef) -> File {
        let text = |column| match row.get(column) {
            Value::Text(text) => text.clone(),
            _ => String::new(),
        };

        File {
            name: text(self.file_name),
            kind: text(self.file_type),
            size: blob.length() as f64,
            held: 0.0,
        }
    }

    /// The file of the item in the answer to [`Self::item_query`], if the
    /// item is there and is one.
    pub(crate) fn blob(&self, found: &[(Vec<u8>, Vec<u8>)], key: &[u8]) -> Option<BlobRef> {
        let table = Table::read(found)?;

        match table.row(key)?.get(self.file) {
            Value::Blob(blob) => Some(*blob),
            _ => None,
        }
    }

    /// Adds a file under `key`: a reference to bytes this device holds
    /// whole, and what to call them.
    pub(crate) fn add_file(
        &self,
        key: [u8; 16],
        file: (BlobRef, String, String),
        author: [u8; 32],
        now: i64,
    ) -> Transaction {
        let (blob, name, kind) = file;
        let cells = [
            (self.body, Value::from(String::new())),
            (self.author, Value::from(author.to_vec())),
            (self.created, Value::from(now)),
            (self.file, Value::from(blob)),
            (self.file_name, Value::from(name)),
            (self.file_type, Value::from(kind)),
        ];

        Transaction::new().insert(self.items, key, cells)
    }

    /// Adds an item under `key`.
    pub(crate) fn add(
        &self,
        key: [u8; 16],
        body: String,
        author: [u8; 32],
        now: i64,
    ) -> Transaction {
        let cells = [
            (self.body, Value::from(body)),
            (self.author, Value::from(author.to_vec())),
            (self.created, Value::from(now)),
        ];

        Transaction::new().insert(self.items, key, cells)
    }

    /// Deletes the item in the answer to [`Self::item_query`], or `None`
    /// if it's already gone.
    pub(crate) fn delete(&self, found: &[(Vec<u8>, Vec<u8>)], key: &[u8]) -> Option<Transaction> {
        let table = Table::read(found)?;
        let row = table.row(key)?;

        Some(Transaction::new().delete_row(self.items, row))
    }
}

/// A key for a new item: when it was written, then randomness.
///
/// A table reads in key order, so leading with the time makes the feed
/// chronological for free, across devices, with no index. The random half
/// keeps two items written in the same millisecond apart.
pub(crate) fn item_key(now: i64, random: [u8; 8]) -> [u8; 16] {
    let mut key = [0; 16];
    key[..8].copy_from_slice(&now.to_be_bytes());
    key[8..].copy_from_slice(&random);

    key
}
