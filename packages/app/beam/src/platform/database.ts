import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * The disk: what beam keeps, and everything it does to it.
 *
 * One database and one version number, so the schema lives above the features
 * rather than inside any one of them — a store added for one feature is a
 * migration every other feature's records live through. The queries are here
 * too, beside the shapes they carry, so there is a single place that opens a
 * connection.
 */

/** Database beam persists to. One per origin. */
export const DATABASE_NAME = 'beam';

/**
 * Schema version this code knows how to create. Bump it alongside a migration
 * in {@link openBeamDatabase} whenever the stores change.
 */
export const DATABASE_VERSION = 4;

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

/**
 * A v3 contact record with the two pairing fields taken off it.
 *
 * Laundered through `unknown` in both directions on purpose: the fields being
 * removed are ones the current {@link Contact} has no knowledge of, so there
 * is no type here that describes the value on the way in. Confined to the
 * migration, which is the only code that ever sees the old shape.
 */
const dropPairingFields = (record: ContactRecord): ContactRecord => {
  const fields = { ...record } as unknown as Record<string, unknown>;

  delete fields.trust;
  delete fields.direction;

  return fields as unknown as ContactRecord;
};

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
 * v4 keeps its rows and edits them. Unlike v3 there's nothing uninterpretable
 * about a v3 record — it carries two fields that no longer mean anything —
 * and a contact is worth more than the trust that used to hang off it, so
 * dropping the fields beats dropping the peers.
 *
 * Each version's changes are guarded on `oldVersion` rather than run as a
 * block, because a database can arrive at any version behind: one opened
 * fresh runs all of it, and one left at v1 runs only what it missed.
 */
export const openBeamDatabase = (): Promise<BeamConnection> =>
  openDB<BeamSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database, oldVersion, _newVersion, transaction) => {
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

      if (oldVersion >= 3 && oldVersion < 4) {
        // `trust` and `direction` went with the pairing handshake. Knowing an
        // endpoint id is what grants access now, so a peer in the book is a
        // peer you can talk to, and the fields it used to be gated on are two
        // stale values a future reader would have to wonder about.
        //
        // Only from v3: a store this migration created a moment ago is empty,
        // and one rebuilt above never held them.
        const contacts = transaction.objectStore(CONTACT_STORE);

        void contacts.getAll().then((records) => {
          for (const record of records) {
            void contacts.put(dropPairingFields(record));
          }
        });
      }
    },
  });

/**
 * Run one query against the database, closing the connection either way.
 *
 * Each call opens its own: queries are rare, and a handle held open across
 * the session is one that blocks the next version upgrade. Failures reach
 * the caller untouched.
 */
const withDatabase = async <T>(
  query: (database: BeamConnection) => Promise<T>,
): Promise<T> => {
  const database = await openBeamDatabase();

  try {
    return await query(database);
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
export const readContacts = (): Promise<ContactRecord[]> =>
  withDatabase((database) => database.getAll(CONTACT_STORE));

/**
 * Write a record through, replacing whatever was at its id. Takes either kind
 * — this device's row is written the same way a peer's is, because on disk it
 * is the same kind of thing.
 */
export const saveContact = async (record: ContactRecord): Promise<void> => {
  await withDatabase((database) => database.put(CONTACT_STORE, record));
};

/** Delete a contact. */
export const removeContact = (endpointId: string): Promise<void> =>
  withDatabase((database) => database.delete(CONTACT_STORE, endpointId));

/**
 * Read back how far setting this device up has got, or `null` if nothing was
 * ever written — a device nobody has started setting up.
 */
export const readOnboarding = async (): Promise<OnboardingRecord | null> =>
  (await withDatabase((database) =>
    database.get(ONBOARDING_STORE, SELF_KEY),
  )) ?? null;

/** Write this device's setup progress through. */
export const saveOnboarding = async (
  record: OnboardingRecord,
): Promise<void> => {
  await withDatabase((database) =>
    database.put(ONBOARDING_STORE, record, SELF_KEY),
  );
};
