import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * The on-disk contract for the beam address book — database and store names,
 * schema version, and the persisted contact shape — plus the opener that
 * applies it. The single source of truth shared by the contact capabilities
 * and their tests, so both speak the same store names and value types.
 */

/** Database the address book persists to. One per origin. */
export const DATABASE_NAME = 'beam';

/**
 * Schema version this code knows how to create. Bump it alongside a migration
 * in {@link openBeamDatabase} whenever the stores change.
 */
export const DATABASE_VERSION = 1;

/** Object store holding one record per paired endpoint. */
export const CONTACT_STORE = 'contacts';

/**
 * How far a peer has got along the trust ladder.
 *
 * - `invited` — a pairing is outstanding in one direction or the other, and
 *   nobody has answered it yet. Persisted rather than held in memory so an
 *   invite survives a reload.
 * - `trusted` — both sides accepted. The only state that permits sharing.
 * - `blocked` — the peer is refused. A sink: nothing promotes out of it
 *   except an explicit unblock, which drops back to `invited` rather than
 *   restoring trust, so a mistaken block can be undone without silently
 *   handing back access.
 */
export type ContactTrust = 'invited' | 'trusted' | 'blocked';

/**
 * Which side opened the pairing. `outbound` means this device dialled the
 * peer (it opened their beam link); `inbound` means the peer dialled us. It's
 * what lets an outstanding invite be phrased from the right side — "waiting
 * on them" versus "waiting on you".
 */
export type ContactDirection = 'outbound' | 'inbound';

/** One paired endpoint, as the address book stores it. */
export interface Contact {
  /** The peer's endpoint public key, hex-encoded. The store's key path. */
  endpointId: string;

  /**
   * The name this device gave the peer, or `null` if it was never renamed.
   * Always wins over {@link suggestedLabel} — a local name shouldn't be
   * overwritten by whatever the peer calls itself.
   */
  label: string | null;

  /**
   * The name the peer advertised for itself, or `null` if it never sent one.
   * Attacker-controlled: it arrives from an unauthenticated stranger, so it's
   * only ever rendered as text and never used to title a blocked entry.
   */
  suggestedLabel: string | null;

  /** How far the peer has got along the trust ladder. */
  trust: ContactTrust;

  /** Which side opened the pairing. */
  direction: ContactDirection;

  /** When the contact first entered the address book, in epoch milliseconds. */
  createdAt: number;

  /** When the peer was last seen, in epoch milliseconds. */
  lastSeenAt: number;
}

/** Typed schema for the beam database, applied to every {@link openDB}. */
export interface BeamSchema extends DBSchema {
  [CONTACT_STORE]: {
    key: string;
    value: Contact;
  };
}

/** A live connection to the beam database. */
export type BeamConnection = IDBPDatabase<BeamSchema>;

/**
 * Open the beam database at {@link DATABASE_VERSION}, creating its store on
 * first use. The contact store takes an in-line key: `endpointId` is already
 * part of every record and is the only thing a contact can be addressed by,
 * so carrying it separately would just be a second copy to keep in sync.
 */
export const openBeamDatabase = (): Promise<BeamConnection> =>
  openDB<BeamSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database) => {
      database.createObjectStore(CONTACT_STORE, { keyPath: 'endpointId' });
    },
  });
