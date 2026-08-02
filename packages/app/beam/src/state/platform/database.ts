import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { createLogger, toError } from '@lib/observability';

/**
 * The disk: what beam keeps, and everything it does to it.
 *
 * One database and one version number, so the schema lives above the features
 * rather than inside any one of them — a store added for one feature is a
 * migration every other feature's records live through. The capabilities that
 * read and write it are here too, beside the shapes they carry, so there is a
 * single place that opens a connection and a single set of rules about what a
 * failed read or a failed write costs.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Database beam persists to. One per origin. */
export const DATABASE_NAME = 'beam';

/**
 * Schema version this code knows how to create. Bump it alongside a migration
 * in {@link openBeamDatabase} whenever the stores change.
 */
export const DATABASE_VERSION = 3;

/**
 * Object store holding one record per endpoint this device knows about,
 * including itself. See {@link ContactRecord}.
 */
export const CONTACT_STORE = 'contacts';

/** Object store holding how far setting this device up has got. One record. */
export const ONBOARDING_STORE = 'onboarding';

/**
 * The store v2 kept this device's name in, dropped in v3. Named here so the
 * migration that removes it doesn't do so against a bare string.
 */
const LEGACY_DEVICE_STORE = 'device';

/**
 * The key the single-record store keeps its one row under. Out-of-line and
 * constant: the record has no natural id, and inventing one would only be a
 * second way to ask for a row there is only ever one of.
 */
export const SELF_KEY = 'self';

/**
 * Where anything read back off disk sits in its lifecycle. Every persisted
 * store in beam wears this, and for the same reasons.
 *
 * - `initial` — the read hasn't been attempted. The site is SSG'd and
 *   IndexedDB is client-only, so this is what prerender and first paint show.
 * - `loading` — the read is in flight.
 * - `ready` — what's in memory is authoritative.
 * - `failed` — IndexedDB was unreadable (blocked in private mode, quota
 *   trouble). Distinct from a `ready` emptiness so the UI can say it couldn't
 *   find out rather than claim there's nothing there.
 */
export type LoadStatus = 'initial' | 'loading' | 'ready' | 'failed';

/**
 * How far a peer has got along the trust ladder.
 *
 * - `invited` — a pairing is outstanding in one direction or the other, and
 *   nobody has answered it yet. Persisted rather than held in memory so an
 *   invite survives a reload.
 * - `trusted` — both sides accepted. The only state that permits sharing.
 *
 * There is no blocked state. Refusing a peer is the same thing as never
 * answering its invite, and a peer you want gone can be forgotten outright.
 */
export type ContactTrust = 'invited' | 'trusted';

/**
 * Which side opened the pairing. `outbound` means this device dialled the
 * peer (it opened their beam link); `inbound` means the peer dialled us. It's
 * what lets an outstanding invite be phrased from the right side — "waiting
 * on them" versus "waiting on you".
 */
export type ContactDirection = 'outbound' | 'inbound';

/** What every row in the contact store carries, whoever it's about. */
interface EndpointRecord {
  /** The endpoint's public key, hex-encoded. The store's key path. */
  endpointId: string;

  /** The name typed for this endpoint here, or `null` if nobody typed one. */
  label: string | null;

  /** When the row entered the store, in epoch milliseconds. */
  createdAt: number;
}

/** One paired endpoint, as the address book stores it. */
export interface Contact extends EndpointRecord {
  /** Marks this row as being about somebody else. */
  kind: 'peer';

  /**
   * The name this device gave the peer, or `null` if it was never renamed.
   * Always wins over {@link Contact.suggestedLabel} — a local name shouldn't
   * be overwritten by whatever the peer calls itself.
   */
  label: string | null;

  /**
   * The name the peer advertised for itself, or `null` if it never sent one.
   * Attacker-controlled: it arrives from an unauthenticated stranger, so it's
   * only ever rendered as text, and any length of it has to survive the
   * layout it lands in.
   */
  suggestedLabel: string | null;

  /** How far the peer has got along the trust ladder. */
  trust: ContactTrust;

  /** Which side opened the pairing. */
  direction: ContactDirection;

  /** When the peer was last seen, in epoch milliseconds. */
  lastSeenAt: number;
}

/**
 * This device's own row in the contact store.
 *
 * The same table as the peers because it's the same kind of thing: an
 * endpoint with a name on it, addressed by its key. Its own *shape* because
 * almost nothing else a contact carries means anything about yourself —
 * there is no name you advertised to yourself, no trust to grant, and no
 * side that opened the pairing.
 *
 * The `kind` tag is what keeps the two apart on the way back in. Every row
 * arrives in one read, and the tag is on the record rather than inferred from
 * matching the endpoint id against the live key — which would make the split
 * depend on the wasm having loaded, and would quietly reclassify this device
 * as a stranger if its key were ever rotated.
 */
export interface SelfContact extends EndpointRecord {
  /** Marks this row as being about this device. */
  kind: 'self';

  /**
   * The name the reader gave this device, or `null` if they never gave one.
   * It's what every peer sees, and what they save this device under, so it
   * outlives the connection it was first advertised over.
   */
  label: string | null;
}

/** Anything the contact store holds: a peer, or this device. */
export type ContactRecord = Contact | SelfContact;

/**
 * How far setting this device up has got.
 *
 * - `naming` — nobody has told this device what it's called. Where a device
 *   nobody has touched starts.
 * - `pairing` — it has a name, and has never met another device.
 * - `done` — it's met one. Beam proper from here on.
 *
 * Persisted rather than derived. It was derived once — from whether a key
 * existed, and whether the address book was empty — and both of those signals
 * turned out to mean other things too, so a device that had merely forgotten
 * its only contact got walked through setup again.
 */
export type OnboardingStep = 'naming' | 'pairing' | 'done';

/** Progress through setting this device up. One record, under {@link SELF_KEY}. */
export interface OnboardingRecord {
  /** Which step the device is on. */
  step: OnboardingStep;

  /**
   * When the device last finished a step and moved to this one, in epoch
   * milliseconds. Nothing reads it yet; it's here because a step is an event
   * and the date it happened is the part that can't be reconstructed later —
   * "started setup a year ago and never finished" is a different device from
   * one that stalled this morning.
   */
  updatedAt: number;
}

/** Typed schema for the beam database, applied to every {@link openDB}. */
export interface BeamSchema extends DBSchema {
  [CONTACT_STORE]: {
    key: string;
    value: ContactRecord;
  };
  [ONBOARDING_STORE]: {
    key: string;
    value: OnboardingRecord;
  };
}

/** A live connection to the beam database. */
export type BeamConnection = IDBPDatabase<BeamSchema>;

/**
 * Open the beam database at {@link DATABASE_VERSION}, bringing whatever is on
 * disk up to it.
 *
 * The contact store takes an in-line key: `endpointId` is already part of
 * every record and is the only thing an endpoint can be addressed by, so
 * carrying it separately would just be a second copy to keep in sync. The
 * onboarding store holds one row and takes {@link SELF_KEY} from the outside.
 *
 * v3 rebuilds the contacts rather than migrating them. Every row predating it
 * is untagged, which the reader has no way to interpret — and beam is behind a
 * flag with no users to strand, so the honest move is to start the store over
 * and let the pairings be made again.
 *
 * Each version's changes are guarded on `oldVersion` rather than run as a
 * block, because a database can arrive at any version behind: one opened
 * fresh runs all of it, and one left at v1 runs only what it missed.
 */
export const openBeamDatabase = (): Promise<BeamConnection> =>
  openDB<BeamSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database, oldVersion) => {
      if (oldVersion < 2) {
        database.createObjectStore(ONBOARDING_STORE);
      }

      if (oldVersion < 3) {
        // Both are gone in v3: the device's name moved into the contact store
        // as a row of its own, and every contact written before that is a
        // record with no `kind` on it.
        //
        // Untyped, because a store the current schema doesn't have is a store
        // the typed handle can't name — which is the point of dropping it.
        const legacy = database as unknown as IDBPDatabase;

        for (const store of [LEGACY_DEVICE_STORE, CONTACT_STORE]) {
          if (legacy.objectStoreNames.contains(store)) {
            legacy.deleteObjectStore(store);
          }
        }

        database.createObjectStore(CONTACT_STORE, { keyPath: 'endpointId' });
      }
    },
  });

/**
 * Read something back off disk, reporting and rethrowing on failure.
 *
 * Rethrowing is the rule for every read here: absent data and unreadable data
 * mean different things to the caller — an empty address book is not one that
 * wouldn't open, and a device with no setup progress is not one whose disk
 * refused — so the difference has to survive this layer.
 *
 * The connection is closed either way. Each call opens its own: reads are
 * rare, and a handle held open across the session is one that blocks the next
 * version upgrade.
 */
const readFromDisk = async <T>(
  signal: AbortSignal,
  failure: string,
  query: (database: BeamConnection) => Promise<T>,
): Promise<T> => {
  const database = await openBeamDatabase();

  try {
    const result = await query(database);
    signal.throwIfAborted();
    return result;
  } catch (error) {
    if (!signal.aborted) logger.error(failure, { error: toError(error) });
    throw error;
  } finally {
    database.close();
  }
};

/**
 * Write something through to disk, reporting and swallowing on failure.
 *
 * Swallowing is the rule for every write here, and it's the mirror of the
 * read rule. The change is already in memory by the time this runs — folds
 * commit first so the UI answers the tap immediately — so a failure costs
 * durability, not the session, and there is nothing to undo. Rejecting would
 * only surface as an unhandled saga failure.
 *
 * `context` is what the log needs to say *which* write was lost; `failure`
 * says what the reader will notice.
 */
const writeToDisk = async (
  failure: string,
  context: Record<string, unknown>,
  mutate: (database: BeamConnection) => Promise<unknown>,
): Promise<void> => {
  const database = await openBeamDatabase();

  try {
    await mutate(database);
  } catch (error) {
    logger.error(failure, { ...context, error: toError(error) });
  } finally {
    database.close();
  }
};

/**
 * Read the whole contact store back — every peer, and this device's own row
 * with them. Small by nature, so it loads in full rather than paging.
 *
 * One read for both, and no filtering here: the rows are tagged, and sorting
 * them out is a decision about state rather than about storage. It also means
 * the device's name arrives without waiting on the wasm to say what this
 * device's address is.
 */
export const readContacts = (signal: AbortSignal): Promise<ContactRecord[]> =>
  readFromDisk(signal, 'Could not read the address book.', (database) =>
    database.getAll(CONTACT_STORE),
  );

/**
 * Write a record through, replacing whatever was at its id. Takes either kind
 * — this device's row is written the same way a peer's is, because on disk it
 * is the same kind of thing.
 */
export const saveContact = (
  _signal: AbortSignal,
  record: ContactRecord,
): Promise<void> =>
  writeToDisk(
    'Could not persist a contact; the change may not survive.',
    { kind: record.kind, endpointId: record.endpointId },
    (database) => database.put(CONTACT_STORE, record),
  );

/**
 * Delete a contact. A failed delete has the sharper edge: the contact comes
 * back on the next reload, which is what the log is there to explain.
 */
export const removeContact = (
  _signal: AbortSignal,
  endpointId: string,
): Promise<void> =>
  writeToDisk(
    'Could not delete a contact; it may return on reload.',
    { endpointId },
    (database) => database.delete(CONTACT_STORE, endpointId),
  );

/**
 * Read back how far setting this device up has got, or `null` if nothing was
 * ever written.
 *
 * The `null` matters: absent progress means "walk this reader through setup",
 * and a device whose disk merely wouldn't open must not be walked through it
 * again — it may well be finished, with contacts who know it. That case
 * throws, per {@link readFromDisk}.
 */
export const readOnboarding = async (
  signal: AbortSignal,
): Promise<OnboardingRecord | null> => {
  const record = await readFromDisk(
    signal,
    'Could not read this device’s setup progress.',
    (database) => database.get(ONBOARDING_STORE, SELF_KEY),
  );

  return record ?? null;
};

/** Write this device's setup progress through. */
export const saveOnboarding = (
  _signal: AbortSignal,
  record: OnboardingRecord,
): Promise<void> =>
  writeToDisk(
    'Could not persist setup progress; this step may repeat.',
    { step: record.step },
    (database) => database.put(ONBOARDING_STORE, record, SELF_KEY),
  );
