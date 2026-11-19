//! What a beam group holds, and where.
//!
//! Every device derives these ids alike, from constants: that's how two
//! devices agree on where the items are without talking. Nothing here is
//! created twice. The founder creates the tables in the transaction that
//! names the group, and everyone else finds them there.

use serde::Serialize;
use woodland::{ColumnId, GroupId, ModelId, Query, Row, Table, Transaction, Value};

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

/// The models of one group, and the columns of its tables.
#[derive(Clone, Copy)]
pub(crate) struct Schema {
    group: GroupId,
    /// What the group says about itself: a map, last write wins.
    meta: ModelId,
    /// What's been shared, a row each. Keyed so that key order is the
    /// order they were written in: see [`item_key`].
    items: ModelId,
    body: ColumnId,
    author: ColumnId,
    created: ColumnId,
}

/// A group as the host lists it.
#[derive(Serialize)]
pub(crate) struct Group {
    id: String,
    name: String,
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
}

impl Schema {
    pub(crate) fn of(group: GroupId) -> Self {
        let items = ModelId::table(group, nonce(b"beam/items"));

        Self {
            group,
            meta: ModelId::kv(group, nonce(b"beam/meta")),
            items,
            body: ColumnId::text(items, nonce(b"body")),
            author: ColumnId::bytes(items, nonce(b"author")),
            created: ColumnId::integer(items, nonce(b"created")),
        }
    }

    /// What a founder writes first: the tables, and the group's name.
    pub(crate) fn found(&self, name: &str) -> Transaction {
        let columns = [
            (self.body, "body"),
            (self.author, "author"),
            (self.created, "created"),
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
    pub(crate) fn group(&self, found: Vec<(Vec<u8>, Vec<u8>)>) -> Group {
        let name = found.into_iter().next();
        let name = name.map(|(_, value)| String::from_utf8_lossy(&value).into_owned());

        Group {
            id: hex::encode(self.group.as_bytes()),
            name: name.unwrap_or_default(),
        }
    }

    pub(crate) fn items_query(&self) -> Query {
        Query::table(self.group, self.items)
    }

    pub(crate) fn item_query(&self, key: &[u8]) -> Query {
        Query::row(self.group, self.items, key)
    }

    /// Every item in the answer to [`Self::items_query`], oldest first.
    pub(crate) fn items(&self, found: &[(Vec<u8>, Vec<u8>)]) -> Vec<Item> {
        let table = Table::read(found);
        let rows = table.iter().flat_map(Table::rows);

        rows.map(|row| self.item(row)).collect()
    }

    fn item(&self, row: &Row) -> Item {
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

        Item {
            id: hex::encode(row.key()),
            body,
            author,
            created_at,
        }
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
