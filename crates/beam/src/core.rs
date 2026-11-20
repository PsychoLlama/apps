//! What the device and its connections share: the database, who it's
//! talking to, and what to do with the outcome of every step.
//!
//! The database is a state machine. Every call that changes anything
//! returns [`Outputs`], and the same things are owed after each one:
//! deliver its messages, finish what it left unfinished, and tell the host
//! what may read differently. [`Core::finish`] is that, in one place.

use std::cell::{Cell, RefCell};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::rc::Rc;

use ed25519_dalek::VerifyingKey;
use iroh::endpoint::Connection;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::{Mutex, Notify};
use wasm_bindgen::prelude::*;
use woodland::{
    BlobPolicy, BrowserStore, Changed, Database, Error, GroupId, Outputs, Reconfigured, Role,
    SealingKey, Standing,
};

use crate::hex;

/// The database this app runs on.
pub(crate) type Db = Database<BrowserStore>;

/// How many checkpoints of one group are attempted while finishing one
/// step. One commits, the next finds nothing to do.
const MOST_ATTEMPTS: u8 = 3;

/// A peer, by the 32 bytes of its key. iroh and woodland each wrap the
/// same bytes in a type of their own; this is what they have in common.
pub(crate) type PeerId = [u8; 32];

/// The secret half of an invitation: proof a joiner was handed it.
pub(crate) type Token = [u8; 16];

#[wasm_bindgen]
extern "C" {
    /// Something went wrong that nobody is waiting to hear about.
    #[wasm_bindgen(js_namespace = console)]
    pub(crate) fn warn(message: &str);
}

/// One live connection to a peer, as somewhere to put messages for it.
pub(crate) struct Link {
    /// Tells this connection from another to the same peer.
    id: u64,
    /// Messages to write, in order.
    outbound: UnboundedSender<Vec<u8>>,
    /// Wakes whatever carries blob bytes on this connection: the database
    /// has something to say to the peer about them.
    blobs: Rc<Notify>,
}

/// A device that was let into a group, and hasn't been given its role by
/// a checkpoint yet.
///
/// Kept so the request can be made again: one that loses a race with
/// another change to the group is spent, and names everyone as the group
/// was then, so the library won't repeat it by itself.
pub(crate) struct Admission {
    group: GroupId,
    peer: VerifyingKey,
    /// What the group's secret is sealed to, for the new device.
    key: SealingKey,
}

/// How long an invitation can be used for, in milliseconds. Long enough
/// to find the other device and open a link on it. It's kept in memory,
/// so it also ends when this device is closed.
const INVITE_FOR: f64 = 600_000.0;

/// How often committed history is shed while the device stays open, in
/// milliseconds. It's also shed on every open.
const UPKEEP: f64 = 600_000.0;

/// Open the database kept in the store called `store`, ready to hold
/// groups, with the steps that getting it ready took still to be
/// [finished](Core::finish).
pub(crate) async fn open_database(store: &str) -> Result<(Db, Vec<Outputs>), String> {
    let store = BrowserStore::open(store).await.map_err(text)?;

    // Fresh bytes every time. They're used only if the store is new;
    // after that the store's own key wins.
    let mut seed = [0; 32];
    getrandom::fill(&mut seed).map_err(text)?;
    let mut database = Database::open(store, seed).await.map_err(text)?;

    // Said on every start, since there's no default and no group can be
    // held until it is. This device keeps whatever its groups share.
    let policy = database.set_blob_policy(BlobPolicy::All).await;
    let mut steps = vec![policy.map_err(text)?];

    // An import outlives a restart, and nothing here carries one on: the
    // page that was reading the file is gone. Whatever was unfinished, or
    // finished and never written, is let go.
    for import in database.imports().await.map_err(text)? {
        let abandoned = database.abandon_import(import.id).await;
        steps.push(abandoned.map_err(text)?);
    }

    Ok((database, steps))
}

fn text(error: impl std::fmt::Display) -> String {
    error.to_string()
}

pub(crate) struct Core {
    /// `None` once closed.
    ///
    /// Behind a lock because the database takes one step at a time, and
    /// neither the host nor the network waits for one to settle before
    /// asking for the next. Whoever holds the lock is the step.
    pub(crate) database: Mutex<Option<Db>>,
    /// The key peers know this device by, and items name as their author.
    pub(crate) id: PeerId,
    pub(crate) endpoint: iroh::Endpoint,
    /// Called with a group's id whenever something in it may read
    /// differently.
    on_change: js_sys::Function,
    /// Called once, with why, if the store fails. Nothing works after.
    on_fault: js_sys::Function,
    faulted: Cell<bool>,
    /// When history was last shed.
    kept: Cell<f64>,
    /// Every live connection, by peer. Two devices that dial each other at
    /// once hold two for a while, and that's fine: a peer is connected
    /// while it has any, and messages go out on the newest.
    peers: RefCell<BTreeMap<PeerId, Vec<Link>>>,
    /// Invitations out, and the group each lets a device into.
    invites: RefCell<BTreeMap<Token, (GroupId, f64)>>,
    admissions: RefCell<Vec<Admission>>,
    /// Groups this device holds a role in, as of the last time it looked.
    /// Kept to notice the moment it stops holding one.
    roles: RefCell<BTreeSet<GroupId>>,
    /// Peers being dialled, or served on a connection this device dialled.
    pub(crate) dialing: RefCell<BTreeSet<PeerId>>,
    /// Wakes the dialer: who this device should be connected to may have
    /// changed.
    pub(crate) membership: Notify,
    /// When something last happened that a checkpoint could commit.
    active: Cell<f64>,
    links: Cell<u64>,
}

impl Core {
    pub(crate) fn new(
        id: PeerId,
        endpoint: iroh::Endpoint,
        on_change: js_sys::Function,
        on_fault: js_sys::Function,
    ) -> Self {
        Self {
            on_fault,
            faulted: Cell::new(false),
            kept: Cell::new(js_sys::Date::now()),
            database: Mutex::new(None),
            id,
            endpoint,
            on_change,
            peers: RefCell::default(),
            invites: RefCell::default(),
            admissions: RefCell::default(),
            roles: RefCell::default(),
            dialing: RefCell::default(),
            membership: Notify::new(),
            active: Cell::new(js_sys::Date::now()),
            links: Cell::new(0),
        }
    }

    /// Do what a step asked for, and every step that follows from it.
    ///
    /// Messages go to whoever is connected; one for a peer that isn't is
    /// dropped, and the protocol recovers when they meet again. The host is
    /// told last, once, which groups to read again.
    pub(crate) async fn finish(&self, database: &mut Db, outputs: Outputs) -> Result<(), Error> {
        let settled = self.settle(database, outputs, None).await;

        self.check(settled)
    }

    /// Pass a step's result on, telling the host first if it says the
    /// store has failed.
    ///
    /// A database whose store failed refuses everything until it's opened
    /// again, and the worker that holds it is the thing to open again. So
    /// the host is told once, and what it does is ask to be reloaded.
    pub(crate) fn check<T>(&self, result: Result<T, Error>) -> Result<T, Error> {
        if let Err(error @ (Error::Store(_) | Error::Broken)) = &result
            && !self.faulted.replace(true)
        {
            let reason = JsValue::from_str(&error.to_string());
            let _ = self.on_fault.call1(&JsValue::NULL, &reason);
        }

        result
    }

    /// Whether it's been long enough since history was last shed.
    pub(crate) fn upkeep_due(&self) -> bool {
        js_sys::Date::now() - self.kept.get() > UPKEEP
    }

    /// Shed the committed history of every group this device is in.
    ///
    /// Nothing reads differently afterwards. It's what lets go of deleted
    /// items for good, and of the bytes of deleted files: a blob goes
    /// when nothing refers to it, and until history is shed, the write
    /// that shared it still does.
    ///
    /// A group that can't be compacted right now is left for next time.
    pub(crate) async fn upkeep(&self, database: &mut Db) {
        self.kept.set(js_sys::Date::now());

        let groups: Vec<GroupId> = database.groups().collect();
        for group in groups {
            if !has_role(database, group, &self.id) || !database.reads(group) {
                continue;
            }

            let compacted = match self.check(database.compact(group).await) {
                Ok(outputs) => self.finish(database, outputs).await,
                Err(error) => Err(error),
            };

            if let Err(error) = compacted {
                warn(&format!("beam: couldn't compact a group: {error}"));
            }
        }
    }

    /// [`Self::finish`] a step that asked something of `group`, attempting
    /// a checkpoint of it whether or not the step changed anything here.
    ///
    /// A request to change who's in a group changes nothing by being
    /// made, so nothing in what the step returns says there's something
    /// to commit.
    pub(crate) async fn finish_in(
        &self,
        database: &mut Db,
        group: GroupId,
        outputs: Outputs,
    ) -> Result<(), Error> {
        let settled = self.settle(database, outputs, Some(group)).await;

        self.check(settled)
    }

    /// Every step that follows from `outputs`, and a checkpoint attempt
    /// for each group they changed, and for `also`.
    ///
    /// A write is provisional until a checkpoint commits it. An attempt
    /// costs nothing where there's nothing to commit, where this device
    /// may not propose, or where one is under way already. So one is made
    /// after anything that might have left something to commit, and
    /// commits happen as fast as devices can talk: a device that is its
    /// group's whole quorum never shows its own write provisional.
    ///
    /// Time passing is a different thing, and the timer's: see
    /// `net::tick`.
    async fn settle(
        &self,
        database: &mut Db,
        outputs: Outputs,
        also: Option<GroupId>,
    ) -> Result<(), Error> {
        let mut changed = BTreeSet::new();
        let mut members = false;
        let mut blobs = false;
        let mut due: BTreeSet<GroupId> = also.into_iter().collect();
        let mut attempts = BTreeMap::<GroupId, u8>::new();
        let mut steps = VecDeque::from([outputs]);

        loop {
            let Some(outputs) = steps.pop_front() else {
                let Some(group) = due.pop_first() else {
                    break;
                };

                // An attempt that commits changes the group, which asks
                // for another, which finds nothing to do. Bounded anyway:
                // nothing here should be able to spin.
                let attempt = attempts.entry(group).or_default();
                let member = database.standing(group) == Some(Standing::Member);
                if member && *attempt < MOST_ATTEMPTS {
                    *attempt += 1;
                    steps.push_back(database.checkpoint(group).await?);
                }

                continue;
            };

            for (peer, message) in outputs.sends {
                self.send(&peer.to_bytes(), message);
            }

            // Blob bytes go on a stream of their own, a part at a time, so
            // a large file never holds up anything here.
            for peer in outputs.blobs {
                self.wake_blobs(&peer.to_bytes());
            }

            for change in &outputs.changed {
                changed.extend(group_of(change));
                due.extend(group_of(change));
                members |= matches!(change, Changed::Members { .. });
                blobs |= matches!(change, Changed::Blob { .. });

                // The group let this device go, whether it asked to be or
                // not. Either way it forgets the group, and everything it
                // held of it, now that it can: a member has signed things,
                // and a device that isn't one has no business keeping what
                // the group shared.
                //
                // Best-effort, as it has to be. A device that was taken
                // rather than removed only does this if it's running this
                // code and hears about it.
                //
                // Looked for on every change and not only a change of
                // members: that's also how a role this device was given,
                // or founded a group with, comes to be known here.
                if let Some(group) = group_of(change)
                    && self.lost_role(database, group)
                {
                    steps.push_back(database.forget(group).await?);
                }
            }

            for (group, became) in outputs.reconfigured {
                // The group changed some other way first. Whoever was
                // waiting to be let in is asked for again, as it is now.
                if became == Reconfigured::Spent {
                    steps.extend(self.admit(database, group).await?);
                }
            }

            if outputs.unfinished {
                steps.push_back(database.resume().await?);
            }
        }

        if members {
            self.settle_admissions(database);
            self.membership.notify_one();
        }

        // How much of a file is here changed. A blob belongs to no one
        // group, so every group is read again: finding which rows refer to
        // it would cost the same reads.
        if blobs {
            changed.extend(database.groups());
        }

        if !changed.is_empty() {
            self.touch();
        }

        // A handler that throws is the host's problem, not the step's: the
        // step is already durable.
        for group in changed {
            let group = JsValue::from_str(&hex::encode(group.as_bytes()));
            let _ = self.on_change.call1(&JsValue::NULL, &group);
        }

        Ok(())
    }

    /// Let time pass: attempt a checkpoint, and see it through.
    pub(crate) async fn tick(&self, database: &mut Db) -> Result<(), Error> {
        let outputs = self.check(database.tick().await)?;

        self.finish(database, outputs).await
    }

    /// Note that something happened a checkpoint could commit.
    pub(crate) fn touch(&self) {
        self.active.set(js_sys::Date::now());
    }

    /// How long since anything happened a checkpoint could commit, in
    /// milliseconds.
    pub(crate) fn idle_for(&self) -> f64 {
        js_sys::Date::now() - self.active.get()
    }

    /// Promise `peer` a place in `group`. Nothing is asked of the group
    /// until [`Self::admit`].
    pub(crate) fn promise(&self, group: GroupId, peer: VerifyingKey, key: SealingKey) {
        let admission = Admission { group, peer, key };
        self.admissions.borrow_mut().push(admission);
    }

    /// Ask `group` to take in everyone promised a place who doesn't have
    /// one: the group as its latest checkpoint has it, and them. `None` if
    /// there's no one to add.
    ///
    /// Built from the configuration every time, never from a list kept
    /// here, so nobody the group gained meanwhile is asked out of it.
    pub(crate) async fn admit(
        &self,
        database: &mut Db,
        group: GroupId,
    ) -> Result<Option<Outputs>, Error> {
        let Some(configuration) = database.configuration(group) else {
            return Ok(None);
        };

        let mut roles = configuration.roles;
        let before = roles.len();
        for admission in self.admissions.borrow().iter() {
            let held = roles.iter().any(|(peer, _)| *peer == admission.peer);
            if admission.group == group && !held {
                // Equal weight for every device: any majority decides.
                let role = Role::contributor(1).sealed_to(admission.key.clone());
                roles.push((admission.peer, role));
            }
        }

        if roles.len() == before {
            return Ok(None);
        }

        database.reconfigure(group, roles).await.map(Some)
    }

    /// Be done with a group other devices are in: forget it at once if
    /// this device has no role in it, or else ask to be removed and forget
    /// it when that's carried. A member has signed things it can't walk
    /// away from.
    ///
    /// Not for the last member, who can't be removed.
    pub(crate) async fn depart(&self, database: &mut Db, group: GroupId) -> Result<(), Error> {
        if !has_role(database, group, &self.id) {
            let outputs = database.forget(group).await?;
            return self.finish(database, outputs).await;
        }

        let Some(configuration) = database.configuration(group) else {
            return Ok(());
        };

        // Everyone the group has now, but for this device.
        let mut roles = configuration.roles;
        roles.retain(|(peer, _)| peer.to_bytes() != self.id);

        let asked = database.reconfigure(group, roles).await?;

        self.finish_in(database, group, asked).await
    }

    /// Forget the promises a checkpoint has kept.
    fn settle_admissions(&self, database: &Db) {
        self.admissions.borrow_mut().retain(|admission| {
            let configuration = database.configuration(admission.group);

            configuration.is_some_and(|it| it.role(&admission.peer).is_none())
        });
    }

    /// Everyone this device should be connected to: whoever holds a role
    /// in any of its groups, has been asked for one, or was promised one.
    pub(crate) fn wanted(&self, database: &Db) -> BTreeSet<PeerId> {
        let mut wanted = BTreeSet::new();
        for group in database.groups() {
            let Some(configuration) = database.configuration(group) else {
                continue;
            };

            let asked = configuration.asked.into_iter().flatten();
            let roles = configuration.roles.into_iter().chain(asked);
            wanted.extend(roles.map(|(peer, _)| peer.to_bytes()));
        }

        let promised = self.admissions.borrow();
        wanted.extend(promised.iter().map(|it| it.peer.to_bytes()));
        wanted.remove(&self.id);

        wanted
    }

    /// Note which groups this device holds a role in. Called once, when
    /// the database is opened.
    pub(crate) fn remember_roles(&self, database: &Db) {
        let held = database.groups();
        let held = held.filter(|group| has_role(database, *group, &self.id));

        *self.roles.borrow_mut() = held.collect();
    }

    /// Whether this device held a role in `group` when it last looked and
    /// doesn't now. Looks, so it says so once.
    ///
    /// The change is what matters, and not the standing. A device that
    /// was removed, forgot the group, and is being let back in also has
    /// no role, and the group still says it was shut out. Going by that
    /// would have it forget the group it's in the middle of joining.
    fn lost_role(&self, database: &Db, group: GroupId) -> bool {
        let mut roles = self.roles.borrow_mut();

        if has_role(database, group, &self.id) {
            roles.insert(group);
            return false;
        }

        roles.remove(&group)
    }

    /// Remember an invitation to `group`, good for [`INVITE_FOR`].
    pub(crate) fn invite(&self, token: Token, group: GroupId) {
        let now = js_sys::Date::now();
        let mut invites = self.invites.borrow_mut();

        invites.retain(|_, (_, expires)| *expires > now);
        invites.insert(token, (group, now + INVITE_FOR));
    }

    /// The group `token` invites to, if it's one of this device's and
    /// hasn't run out.
    pub(crate) fn invited(&self, token: &Token) -> Option<GroupId> {
        let (group, expires) = self.invites.borrow().get(token).copied()?;

        (expires > js_sys::Date::now()).then_some(group)
    }

    /// Use `token` up: the group it invites to, once.
    pub(crate) fn spend(&self, token: &Token) -> Option<GroupId> {
        let group = self.invited(token)?;
        self.invites.borrow_mut().remove(token);

        Some(group)
    }

    /// Tell the host to read every group again: something changed that
    /// isn't in any of them, such as who is reachable.
    pub(crate) fn announce_all(&self, database: &Db) {
        for group in database.groups() {
            let group = JsValue::from_str(&hex::encode(group.as_bytes()));
            let _ = self.on_change.call1(&JsValue::NULL, &group);
        }
    }

    pub(crate) fn is_connected(&self, peer: &PeerId) -> bool {
        self.peers.borrow().contains_key(peer)
    }

    /// File a new connection to `peer`, returning its id and whether it's
    /// the only one: the peer has just become reachable.
    pub(crate) fn attach(
        &self,
        connection: &Connection,
        outbound: UnboundedSender<Vec<u8>>,
        blobs: Rc<Notify>,
    ) -> (u64, bool) {
        let peer: PeerId = *connection.remote_id().as_bytes();
        let id = self.links.get();
        self.links.set(id + 1);

        let mut peers = self.peers.borrow_mut();
        let links = peers.entry(peer).or_default();
        links.push(Link {
            id,
            outbound,
            blobs,
        });

        (id, links.len() == 1)
    }

    /// Strike a connection that has ended, returning whether it was the
    /// last: the peer is no longer reachable.
    pub(crate) fn detach(&self, peer: &PeerId, id: u64) -> bool {
        let mut peers = self.peers.borrow_mut();
        let Some(links) = peers.get_mut(peer) else {
            return false;
        };

        links.retain(|link| link.id != id);
        let Some(newest) = links.last() else {
            peers.remove(peer);
            return true;
        };

        // Whatever the lost connection was carrying is the next one's now.
        newest.blobs.notify_one();

        false
    }

    /// Tell `peer`'s newest connection there are blob bytes to carry.
    fn wake_blobs(&self, peer: &PeerId) {
        let peers = self.peers.borrow();
        if let Some(link) = peers.get(peer).and_then(|links| links.last()) {
            link.blobs.notify_one();
        }
    }

    /// Queue a message for `peer` on its newest connection. Dropped if
    /// there isn't one.
    fn send(&self, peer: &PeerId, message: Vec<u8>) {
        let peers = self.peers.borrow();
        if let Some(link) = peers.get(peer).and_then(|links| links.last()) {
            let _ = link.outbound.send(message);
        }
    }
}

/// Whether `peer` holds a role in `group`, by the latest checkpoint here.
pub(crate) fn has_role(database: &Db, group: GroupId, peer: &PeerId) -> bool {
    let Ok(peer) = VerifyingKey::from_bytes(peer) else {
        return false;
    };

    let configuration = database.configuration(group);
    configuration.is_some_and(|it| it.role(&peer).is_some())
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
