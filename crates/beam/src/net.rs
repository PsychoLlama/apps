//! Carrying the database between devices.
//!
//! Woodland asks its transport for one thing: an ordered, reliable,
//! authenticated stream between two keys. An iroh connection is
//! authenticated by the peer's key, and a QUIC stream is ordered and
//! reliable, so each side opens one stream per connection and writes its
//! messages down it, each behind its length.
//!
//! Two protocols are spoken:
//!
//! - [`SYNC`] carries the database, for as long as two devices that share
//!   a group can reach each other.
//! - [`LINK`] is how a device gets into a group: once, briefly, between a
//!   device showing an invitation and the one that was handed it.

use std::rc::Rc;
use std::time::Duration;

use ed25519_dalek::VerifyingKey;
use iroh::EndpointId;
use iroh::endpoint::{Connection, RecvStream, VarInt};
use n0_future::future::or;
use n0_future::task::{AbortOnDropHandle, spawn};
use n0_future::time::sleep;
use tokio::sync::{Notify, mpsc};
use wasm_bindgen::prelude::*;
use woodland::{GroupId, SealingKey};

use crate::core::{Core, Db, PeerId, Token, warn};

/// The ALPN the database is carried on. Versioned so a future format can
/// land without a device on the old one mistaking it for something it
/// can read.
pub(crate) const SYNC: &[u8] = b"beam/sync/1";

/// The ALPN a device is let into a group on.
pub(crate) const LINK: &[u8] = b"beam/link/1";

/// Marks a stream as carrying sync messages. A stream says what it's for
/// in its first byte, so another kind can be added beside this one.
const SYNC_STREAM: u8 = 1;

/// Marks a stream as carrying blob bytes. Apart from sync, so a large
/// file is never in the way of a small write.
const BLOB_STREAM: u8 = 2;

/// Largest single message read off a stream. A ceiling on what a peer can
/// make this device buffer, far above anything sync sends in one step.
const MOST_MESSAGE: usize = 16 * 1024 * 1024;

/// Largest invitation taken. It carries the group's chain of checkpoints.
const MOST_INVITATION: usize = 16 * 1024 * 1024;

/// The most groups an invitation names as the ones its group carried on
/// from. A group is started over rarely; a line this long is nonsense.
const MOST_ANCESTORS: usize = 32;

/// What [`join`] rejects with when this device had to leave a group the
/// invitation's group replaced. It's out now, and the invitation is
/// unspent: open the device afresh and use it again.
pub(crate) const LEFT_BEHIND: &str = "left-behind";

/// How long a joiner waits to be let out of a group the one it's joining
/// carried on from, and how often it looks.
const DEPARTING: Duration = Duration::from_secs(45);
const DEPARTING_STEP: Duration = Duration::from_millis(250);

/// What a device says first on the link protocol: which of the two
/// things it's asking.
///
/// Asking what a group carried on from is apart from joining it, and
/// comes first, because the answer changes what the joiner has to do
/// before it joins, and the inviter starts letting it in the moment it
/// asks to be.
const ASK_LINEAGE: u8 = 0;
const ASK_TO_JOIN: u8 = 1;

/// Largest request to be let in: a kind, a token, and a sealing key.
const MOST_REQUEST: usize = 1024;

/// How long a joiner keeps trying to reach the device that invited it,
/// and how long it waits between tries.
const REACHING: Duration = Duration::from_secs(30);
const REACHING_STEP: Duration = Duration::from_secs(1);

/// How often to try peers that couldn't be reached.
const REDIAL: Duration = Duration::from_secs(20);

/// How often time passes, while there's something for it to do.
const TICK: Duration = Duration::from_secs(2);

/// How often time passes right after something changed, and for how long
/// after, in milliseconds. A device being let in, or a note just shared,
/// is waiting on a checkpoint, and someone is watching it wait.
const QUICK_TICK: Duration = Duration::from_millis(300);
const QUICK_FOR: f64 = 5_000.0;

/// How long after the last change to keep ticking, in milliseconds. A
/// checkpoint takes a few exchanges; after this, nothing is coming.
const QUIET_AFTER: f64 = 30_000.0;

/// Sent when a connection is closed on purpose. Nothing reads it.
const DONE: VarInt = VarInt::from_u32(0);

/// Everything that runs for as long as the device is open: answering
/// peers, reaching for them, and letting time pass.
pub(crate) fn run(core: &Rc<Core>) -> Vec<AbortOnDropHandle<()>> {
    vec![
        AbortOnDropHandle::new(spawn(accept(Rc::clone(core)))),
        AbortOnDropHandle::new(spawn(dial(Rc::clone(core)))),
        AbortOnDropHandle::new(spawn(tick(Rc::clone(core)))),
    ]
}

/// Answer whoever dials, for as long as the endpoint is up.
async fn accept(core: Rc<Core>) {
    while let Some(incoming) = core.endpoint.accept().await {
        let core = Rc::clone(&core);

        // Each on a task of its own: a slow handshake holds up nobody.
        spawn(async move {
            let Ok(connection) = incoming.await else {
                return;
            };

            let alpn = connection.alpn().to_vec();
            if alpn == LINK {
                if let Err(error) = admit(&core, &connection).await {
                    warn(&format!("beam: couldn't let a device in: {error}"));
                }
            } else if alpn == SYNC && wants(&core, &connection).await {
                serve(core, connection).await;
            } else {
                connection.close(DONE, b"unknown");
            }
        });
    }
}

/// Whether the peer on `connection` is one this device shares a group
/// with. Anyone else has no business on the sync protocol. Woodland would
/// verify whatever they sent, but there's no reason to do the work.
async fn wants(core: &Core, connection: &Connection) -> bool {
    let database = core.database.lock().await;
    let peer = connection.remote_id();

    database
        .as_ref()
        .is_some_and(|it| core.wanted(it).contains(peer.as_bytes()))
}

/// Keep reaching for every peer this device shares a group with and isn't
/// connected to. Woken when who that is may have changed, and otherwise
/// every so often: a peer that was asleep may not be now.
async fn dial(core: Rc<Core>) {
    loop {
        let wanted = {
            let database = core.database.lock().await;
            database.as_ref().map(|it| core.wanted(it))
        };

        for peer in wanted.into_iter().flatten() {
            let reaching = core.is_connected(&peer) || !core.dialing.borrow_mut().insert(peer);
            if reaching {
                continue;
            }

            let core = Rc::clone(&core);
            spawn(async move {
                if let Ok(id) = EndpointId::from_bytes(&peer)
                    && let Ok(connection) = core.endpoint.connect(id, SYNC).await
                {
                    serve(Rc::clone(&core), connection).await;
                }

                core.dialing.borrow_mut().remove(&peer);
            });
        }

        or(core.membership.notified(), sleep(REDIAL)).await;
    }
}

/// Let time pass, while there's something for it to do.
///
/// A tick is when a device attempts a checkpoint, which is what makes
/// writes final. Nothing about correctness depends on when it happens, so
/// it happens on a coarse timer, and stops once the group has gone quiet.
async fn tick(core: Rc<Core>) {
    loop {
        let quick = core.idle_for() < QUICK_FOR;
        sleep(if quick { QUICK_TICK } else { TICK }).await;

        let upkeep = core.upkeep_due();
        if !upkeep && core.idle_for() > QUIET_AFTER {
            continue;
        }

        let mut database = core.database.lock().await;
        let Some(database) = database.as_mut() else {
            return;
        };

        if upkeep {
            core.upkeep(database).await;
        }

        if let Err(error) = core.tick(database).await {
            warn(&format!("beam: a tick failed: {error}"));
        }
    }
}

/// Carry the database over one connection until it ends.
///
/// Both directions are the same thing once a connection is up: who dialled
/// stops mattering. Each side opens a stream to write on and reads the one
/// the other opened.
async fn serve(core: Rc<Core>, connection: Connection) {
    let peer: PeerId = *connection.remote_id().as_bytes();
    let Ok(key) = VerifyingKey::from_bytes(&peer) else {
        return;
    };

    let (outbound, messages) = mpsc::unbounded_channel();
    let blobs = Rc::new(Notify::new());
    let _writer = AbortOnDropHandle::new(spawn(write(connection.clone(), messages)));
    let _blob_writer = AbortOnDropHandle::new(spawn(write_blobs(
        Rc::clone(&core),
        connection.clone(),
        key,
        Rc::clone(&blobs),
    )));
    let (link, first) = core.attach(&connection, outbound, blobs);

    if first {
        let mut database = core.database.lock().await;
        if let Some(database) = database.as_mut() {
            // Each side says what it holds, and the exchange begins.
            let greeted = match database.connected(key).await {
                Ok(outputs) => core.finish(database, outputs).await,
                Err(error) => Err(error),
            };

            if let Err(error) = greeted {
                warn(&format!("beam: couldn't greet a peer: {error}"));
            }

            // Who is reachable is part of what a group shows.
            core.announce_all(database);
            core.touch();
        }
    }

    // Each stream is read on a task of its own: they run for as long as
    // the connection does, and one mustn't wait on another.
    let mut readers = Vec::new();
    while let Ok(mut stream) = connection.accept_uni().await {
        let core = Rc::clone(&core);

        readers.push(AbortOnDropHandle::new(spawn(async move {
            let mut kind = [0];
            if stream.read_exact(&mut kind).await.is_ok() {
                read(&core, key, kind[0], &mut stream).await;
            }
        })));
    }

    drop(readers);

    if core.detach(&peer, link) {
        let mut database = core.database.lock().await;
        if let Some(database) = database.as_mut() {
            database.disconnected(key);
            core.announce_all(database);
        }

        // If it's still wanted, reach for it again now and not at the
        // next round.
        core.membership.notify_one();
    }
}

/// Write queued messages down a stream of this side's own, in order, each
/// behind its length. Ends when the connection does.
async fn write(connection: Connection, mut messages: mpsc::UnboundedReceiver<Vec<u8>>) {
    let Ok(mut stream) = connection.open_uni().await else {
        return;
    };

    if stream.write_all(&[SYNC_STREAM]).await.is_err() {
        return;
    }

    while let Some(message) = messages.recv().await {
        let Ok(length) = u32::try_from(message.len()) else {
            continue;
        };

        let sent = stream.write_all(&length.to_be_bytes()).await.is_ok()
            && stream.write_all(&message).await.is_ok();
        if !sent {
            return;
        }
    }
}

/// Carry what the database has to say to `peer` about blobs: requests for
/// parts, and the parts themselves, one bounded message at a time.
///
/// The next is only taken once the last has been written, so however
/// large a file is, no more than one part of it is in memory here.
async fn write_blobs(core: Rc<Core>, connection: Connection, peer: VerifyingKey, wake: Rc<Notify>) {
    // Something may have been waiting for a connection.
    wake.notify_one();

    let mut stream = None;
    loop {
        wake.notified().await;

        loop {
            let next = {
                let mut database = core.database.lock().await;
                let Some(database) = database.as_mut() else {
                    return;
                };

                database.next_blob_message(peer).await
            };

            let message = match next {
                Ok(Some(message)) => message,
                Ok(None) => break,
                Err(error) => {
                    warn(&format!("beam: couldn't read a blob to send: {error}"));
                    break;
                }
            };

            // Opened on first use. Most connections never carry a file.
            if stream.is_none() {
                let Ok(mut opened) = connection.open_uni().await else {
                    return;
                };

                if opened.write_all(&[BLOB_STREAM]).await.is_err() {
                    return;
                }

                stream = Some(opened);
            }

            let Some(stream) = stream.as_mut() else {
                return;
            };

            let Ok(length) = u32::try_from(message.len()) else {
                continue;
            };

            let sent = stream.write_all(&length.to_be_bytes()).await.is_ok()
                && stream.write_all(&message).await.is_ok();
            if !sent {
                return;
            }
        }
    }
}

/// Hand the database every message on a stream, in order, until the
/// stream ends or says something it shouldn't. `kind` is what the stream
/// said it carries.
async fn read(core: &Core, peer: VerifyingKey, kind: u8, stream: &mut RecvStream) {
    if kind != SYNC_STREAM && kind != BLOB_STREAM {
        return;
    }

    loop {
        let mut length = [0; 4];
        if stream.read_exact(&mut length).await.is_err() {
            return;
        }

        let length = u32::from_be_bytes(length) as usize;
        if length > MOST_MESSAGE {
            return;
        }

        let mut message = vec![0; length];
        if stream.read_exact(&mut message).await.is_err() {
            return;
        }

        let mut database = core.database.lock().await;
        let Some(database) = database.as_mut() else {
            return;
        };

        let outputs = if kind == BLOB_STREAM {
            database.receive_blob(peer, &message).await
        } else {
            database.receive(peer, &message).await
        };

        let received = match outputs {
            Ok(outputs) => core.finish(database, outputs).await,
            Err(error) => Err(error),
        };

        if let Err(error) = received {
            warn(&format!("beam: couldn't take a message: {error}"));
        }
    }
}

/// Use an invitation: dial the device that showed it, prove this one was
/// handed it, and hold the group it leads to.
///
/// An invitation is believed, which is why it's fetched here and not
/// carried in the code. The code names the inviter's key, the connection
/// is to that key and no other, and so what comes back is from the device
/// that was trusted when its code was scanned.
///
/// This device holds the group at once, and can read and write it when a
/// checkpoint gives it a role: moments later, if the group's quorum is
/// reachable.
pub(crate) async fn join(core: &Core, inviter: PeerId, token: Token) -> Result<GroupId, JsError> {
    let id = EndpointId::from_bytes(&inviter).map_err(to_js)?;
    let refused = || JsError::new("the invitation has expired or was already used");

    // First, the groups this one carried on from. Nothing is spent yet.
    let lineage = ask(core, id, &[&[ASK_LINEAGE], &token[..]]).await?;
    let Some((&count, ancestors)) = lineage.split_first() else {
        return Err(refused());
    };

    if ancestors.len() != usize::from(count) * 32 {
        return Err(JsError::new("the invitation couldn't be read"));
    }

    let (ancestors, _) = ancestors.as_chunks::<32>();
    let ancestors = ancestors.iter().copied().map(GroupId::from_bytes);
    let ancestors: Vec<GroupId> = ancestors.collect();

    if leave_behind(core, &ancestors).await? {
        return Err(JsError::new(LEFT_BEHIND));
    }

    let sealing = {
        let database = core.database.lock().await;
        let database = database.as_ref().ok_or_else(closed)?;
        database.sealing_key().to_bytes()
    };

    // Then the invitation itself. Nothing back is the inviter saying no,
    // without saying why.
    let invitation = ask(core, id, &[&[ASK_TO_JOIN], &token[..], &sealing[..]]).await?;
    if invitation.is_empty() {
        return Err(refused());
    }

    let mut database = core.database.lock().await;
    let database = database.as_mut().ok_or_else(closed)?;
    let (group, outputs) = database.join(&invitation).await.map_err(to_js)?;
    core.finish(database, outputs).await.map_err(to_js)?;

    // There's someone to talk to now.
    core.touch();
    core.membership.notify_one();

    Ok(group)
}

/// Connect to `peer` on the link protocol, trying for a while.
///
/// An invitation is usually opened seconds after it was made, on a device
/// that was opened to use it. Either end may not have found its relay
/// yet, or have said where it is, and then there is no way to the other:
/// a dial fails at once with nothing wrong that waiting won't fix.
async fn reach(core: &Core, peer: EndpointId) -> Result<Connection, JsError> {
    let mut waited = Duration::ZERO;

    loop {
        match core.endpoint.connect(peer, LINK).await {
            Ok(connection) => return Ok(connection),
            Err(error) if waited >= REACHING => return Err(to_js(error)),
            Err(_) => {}
        }

        sleep(REACHING_STEP).await;
        waited += REACHING_STEP;
    }
}

/// Say one thing to `peer` on the link protocol, and read its answer.
async fn ask(core: &Core, peer: EndpointId, request: &[&[u8]]) -> Result<Vec<u8>, JsError> {
    let connection = reach(core, peer).await?;
    let (mut send, mut receive) = connection.open_bi().await.map_err(to_js)?;

    for part in request {
        send.write_all(part).await.map_err(to_js)?;
    }

    send.finish().map_err(to_js)?;

    let answer = receive.read_to_end(MOST_INVITATION).await;
    connection.close(DONE, b"done");

    answer.map_err(to_js)
}

/// Leave whichever of `ancestors` this device still holds, and wait to be
/// let go. Resolves with whether there were any.
///
/// A device that holds a group can't usefully join the one that carried on
/// from it: it joins, and reads nothing. Leaving the old group first, and
/// then starting again from a fresh open, is what works. So the old group
/// goes here, and the caller is told to start over rather than carry on.
/// Nothing of the invitation has been spent by then.
///
/// The inviter is in both groups and is on the line, which is usually
/// everyone the old group needs to agree to let this device go.
async fn leave_behind(core: &Core, ancestors: &[GroupId]) -> Result<bool, JsError> {
    let held = |database: &Db| {
        let held: Vec<GroupId> = database.groups().collect();
        ancestors
            .iter()
            .copied()
            .filter(move |it| held.contains(it))
    };

    {
        let mut database = core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;
        let leaving: Vec<GroupId> = held(database).collect();
        if leaving.is_empty() {
            return Ok(false);
        }

        for group in leaving {
            // One that can't be left is waited out like one that's slow.
            if let Err(error) = core.depart(database, group).await {
                warn(&format!("beam: couldn't leave a group behind: {error}"));
            }
        }

        core.membership.notify_one();
    }

    let mut waited = Duration::ZERO;
    while waited < DEPARTING {
        sleep(DEPARTING_STEP).await;
        waited += DEPARTING_STEP;

        let mut database = core.database.lock().await;
        let database = database.as_mut().ok_or_else(closed)?;
        if held(database).next().is_none() {
            return Ok(true);
        }

        // Leaving is carried by a checkpoint, and this is what attempts
        // one. Nothing else here is in a hurry.
        if let Err(error) = core.tick(database).await {
            warn(&format!("beam: a tick failed: {error}"));
        }
    }

    Err(JsError::new(
        "this device is still leaving the group this one replaced, so try again in a moment",
    ))
}

/// Answer a device asking to be let in: check it was handed an invitation,
/// give it what it needs to hold the group, and ask the group to give it a
/// role.
async fn admit(core: &Core, connection: &Connection) -> Result<(), String> {
    let peer = VerifyingKey::from_bytes(connection.remote_id().as_bytes()).map_err(text)?;
    let (mut send, mut receive) = connection.accept_bi().await.map_err(text)?;
    let request = receive.read_to_end(MOST_REQUEST).await.map_err(text)?;

    let asked = request.split_first();
    let asked = asked.and_then(|(&kind, rest)| Some((kind, rest.split_first_chunk::<16>()?)));
    let Some((kind, (token, rest))) = asked else {
        // Finishing with nothing written is the refusal.
        send.finish().map_err(text)?;
        connection.closed().await;
        return Ok(());
    };

    if kind == ASK_LINEAGE {
        let invited = core.invites.borrow().get(token).copied();
        if let Some(group) = invited {
            let database = core.database.lock().await;
            let database = database.as_ref().ok_or("the device is closed")?;

            // Every group this one carried on from, nearest first.
            let mut ancestors = Vec::new();
            let mut at = group;
            while let Some(before) = database.succeeds(at)
                && ancestors.len() < MOST_ANCESTORS
            {
                ancestors.extend_from_slice(before.as_bytes());
                at = before;
            }

            #[expect(
                clippy::cast_possible_truncation,
                reason = "bounded by MOST_ANCESTORS, which fits a byte"
            )]
            let count = [(ancestors.len() / 32) as u8];
            send.write_all(&count).await.map_err(text)?;
            send.write_all(&ancestors).await.map_err(text)?;
        }

        send.finish().map_err(text)?;
        connection.closed().await;
        return Ok(());
    }

    // An invitation lets one device in, once.
    let granted = SealingKey::from_bytes(rest).filter(|_| kind == ASK_TO_JOIN);
    let granted = granted.and_then(|key| {
        let group = core.invites.borrow_mut().remove(token)?;
        Some((group, key))
    });

    let Some((group, key)) = granted else {
        send.finish().map_err(text)?;
        connection.closed().await;
        return Ok(());
    };

    let invitation = {
        let database = core.database.lock().await;
        let database = database.as_ref().ok_or("the device is closed")?;
        database.invite(group).ok_or("the group is gone")?
    };

    // Promised before the answer goes out, so the joiner's first dial on
    // the sync protocol finds this device expecting it.
    core.promise(group, peer, key);

    // Written with the database let go: a joiner that stalls here holds
    // up nothing but itself.
    send.write_all(&invitation).await.map_err(text)?;
    send.finish().map_err(text)?;

    {
        let mut database = core.database.lock().await;
        let database = database.as_mut().ok_or("the device is closed")?;

        if let Some(outputs) = core.admit(database, group).await.map_err(text)? {
            core.finish(database, outputs).await.map_err(text)?;
        }

        // A device that is its group's whole quorum carries the change now.
        core.tick(database).await.map_err(text)?;
        core.touch();
    }

    // The joiner hangs up once it has read the answer. Leaving first could
    // cut the answer short.
    connection.closed().await;

    Ok(())
}

/// What a call on a closed device rejects with.
fn closed() -> JsError {
    JsError::new("the device is closed")
}

/// An error as the host sees it: a JS `Error` carrying the message.
fn to_js(error: impl std::fmt::Display) -> JsError {
    JsError::new(&error.to_string())
}

fn text(error: impl std::fmt::Display) -> String {
    error.to_string()
}
