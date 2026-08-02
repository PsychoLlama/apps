import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * The on-disk contract for everything beam keeps — database and store names,
 * schema version, the persisted record shapes, and the opener that applies
 * them. Above the features rather than inside any one of them, because there
 * is a single database and a single version number: a store added for one
 * feature is a migration every other feature's records live through.
 *
 * The single source of truth shared by the capabilities and their tests, so
 * both speak the same store names and value types.
 */

/** Database beam persists to. One per origin. */
export const DATABASE_NAME = 'beam';

/**
 * Schema version this code knows how to create. Bump it alongside a migration
 * in {@link openBeamDatabase} whenever the stores change.
 */
export const DATABASE_VERSION = 2;

/** Object store holding one record per paired endpoint. */
export const CONTACT_STORE = 'contacts';

/** Object store holding what this device calls itself. One record. */
export const DEVICE_STORE = 'device';

/** Object store holding how far setting this device up has got. One record. */
export const ONBOARDING_STORE = 'onboarding';

/**
 * The key the single-record stores keep their one row under. Out-of-line and
 * constant: neither record has a natural id, and inventing one would only be
 * a second way to ask for a row there is only ever one of.
 */
export const SELF_KEY = 'self';

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
   * only ever rendered as text, and any length of it has to survive the
   * layout it lands in.
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

/** What this device calls itself. One record, under {@link SELF_KEY}. */
export interface DeviceRecord {
  /**
   * The name the reader gave this device, or `null` if they never gave one.
   * It's what every peer sees, and what they save this device under, so it
   * outlives the connection it was first advertised over.
   *
   * Its own table rather than a field on the onboarding record, and not in
   * the vault either: the name isn't a secret, and it isn't progress through
   * a flow. It's a setting, which is a thing with a much longer life than the
   * one screen that currently asks for it.
   */
  label: string | null;
}

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
    value: Contact;
  };
  [DEVICE_STORE]: {
    key: string;
    value: DeviceRecord;
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
 * every record and is the only thing a contact can be addressed by, so
 * carrying it separately would just be a second copy to keep in sync. The
 * other two hold one row each and take {@link SELF_KEY} from the outside.
 *
 * Each version's changes are guarded on `oldVersion` rather than run as a
 * block, because a database can arrive at any version behind: one opened
 * fresh runs all of it, and one left at v1 runs only what it missed.
 */
export const openBeamDatabase = (): Promise<BeamConnection> =>
  openDB<BeamSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database, oldVersion) => {
      if (oldVersion < 1) {
        database.createObjectStore(CONTACT_STORE, { keyPath: 'endpointId' });
      }

      if (oldVersion < 2) {
        database.createObjectStore(DEVICE_STORE);
        database.createObjectStore(ONBOARDING_STORE);
      }
    },
  });
