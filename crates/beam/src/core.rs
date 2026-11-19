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
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::{Mutex, Notify};
use wasm_bindgen::prelude::*;
use woodland::{
    BrowserStore, Changed, Database, Error, GroupId, Outputs, Reconfigured, Role, SealingKey,
};

use crate::hex;

/// The database this app runs on.
pub(crate) type Db = Database<BrowserStore>;

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
    /// Every live connection, by peer. Two devices that dial each other at
    /// once hold two for a while, and that's fine: a peer is connected
    /// while it has any, and messages go out on the newest.
    peers: RefCell<BTreeMap<PeerId, Vec<Link>>>,
    /// Invitations out, and the group each lets a device into.
    pub(crate) invites: RefCell<BTreeMap<Token, GroupId>>,
    admissions: RefCell<Vec<Admission>>,
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
    pub(crate) fn new(id: PeerId, endpoint: iroh::Endpoint, on_change: js_sys::Function) -> Self {
        Self {
            database: Mutex::new(None),
            id,
            endpoint,
            on_change,
            peers: RefCell::default(),
            invites: RefCell::default(),
            admissions: RefCell::default(),
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
        self.settle(database, outputs, false).await
    }

    /// [`Self::finish`] a step, then let time pass and finish that too,
    /// telling the host once for both.
    ///
    /// A write is provisional until a checkpoint commits it, and a device
    /// attempts one when told time has passed. A device that is its
    /// group's whole quorum commits on its own tick, so nothing a lone
    /// device writes is ever shown provisional.
    pub(crate) async fn finish_and_tick(
        &self,
        database: &mut Db,
        outputs: Outputs,
    ) -> Result<(), Error> {
        self.settle(database, outputs, true).await
    }

    async fn settle(&self, database: &mut Db, outputs: Outputs, tick: bool) -> Result<(), Error> {
        let mut changed = BTreeSet::new();
        let mut members = false;
        let mut blobs = false;
        let mut tick = tick;
        let mut steps = VecDeque::from([outputs]);

        loop {
            let Some(outputs) = steps.pop_front() else {
                if !tick {
                    break;
                }

                tick = false;
                steps.push_back(database.tick().await?);
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
                members |= matches!(change, Changed::Members { .. });
                blobs |= matches!(change, Changed::Blob { .. });
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
        let outputs = database.tick().await?;

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

    pub(crate) fn is_connected(&self, peer: &PeerId) -> bool {
        self.peers.borrow().contains_key(peer)
    }

    /// File a new connection to `peer`, returning its id and whether it's
    /// the only one: the peer has just become reachable.
    pub(crate) fn attach(
        &self,
        peer: PeerId,
        outbound: UnboundedSender<Vec<u8>>,
        blobs: Rc<Notify>,
    ) -> (u64, bool) {
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
