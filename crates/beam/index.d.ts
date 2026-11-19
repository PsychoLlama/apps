/**
 * Public types for `@crate/beam`. Mirrors the `wasm-bindgen`
 * `--target web` output (`dist/beam.d.ts`), but is checked in so consumers
 * type-check without first running the wasm build, and so the loosely-typed
 * corners of the generated output (`Function`) can be narrowed. Keep in sync
 * with the `#[wasm_bindgen]` surface under `src/`.
 */

/** A group this device holds. */
export interface Group {
  /** The group's id, as a hex string. Names it on every device. */
  id: string;

  /**
   * What its members call it. Empty for a group this device can't read, or
   * one whose founding hasn't reached it yet.
   */
  name: string;

  /**
   * Whether this device has a role in the group and can read it. A device
   * that was just let in holds the group before it's in it: it's a member
   * once a checkpoint says so.
   */
  member: boolean;
}

/** Something shared to a group. */
export interface Item {
  /**
   * The item's id within its group, as a hex string. Ids sort in the order
   * items were written.
   */
  id: string;

  /** What was shared: a note or a link, as plain text. */
  body: string;

  /** The id of the device that wrote it, as that device says. */
  author: string;

  /** When it was written, by its author's clock. Epoch milliseconds. */
  createdAt: number;

  /**
   * Whether the group has made it final. Until then it's shown here and
   * shared as peers are reachable, but not yet agreed.
   */
  committed: boolean;
}

/**
 * This device, open: its database over the browser's store, and an endpoint
 * on the network bound under the database's key.
 *
 * A wasm object that owns memory the garbage collector can't see. Call
 * {@link Device.close} to leave cleanly, then {@link Device.free}.
 */
export interface Device extends Disposable {
  /**
   * The address peers dial to reach this device, as a hex string. Also its
   * identity in every group it belongs to. Stable for as long as the store
   * is: a device that loses its store comes back as someone else.
   */
  readonly id: string;

  /**
   * Leave the network and let go of the store, resolving once both are
   * done. Terminal: open another device to come back.
   */
  close(): Promise<void>;

  /**
   * Found a sealed group called `name` with this device as its only member,
   * resolving with the group's id.
   */
  createGroup(name: string): Promise<string>;

  /** Every group this device holds, in id order. */
  groups(): Promise<Group[]>;

  /**
   * Everything shared to `group`, oldest first. Reads what this device
   * knows right now, its own unsynced writes included.
   */
  items(group: string): Promise<Item[]>;

  /**
   * Share `body` to `group`. It shows here at once, and reaches the group's
   * other devices as they're reachable.
   */
  addItem(group: string, body: string): Promise<void>;

  /**
   * Delete `item` from `group`, for every device. Deleting one that's
   * already gone does nothing.
   */
  deleteItem(group: string, item: string): Promise<void>;

  /**
   * Make an invitation to `group`: a code for one other device to
   * {@link Device.join} with, once, while this device is online. Whoever
   * holds the code can be let in, so show it only to the device meant to
   * have it. Throws if `group` isn't a group id.
   */
  invite(group: string): string;

  /** Take back an invitation that hasn't been used. */
  cancelInvite(code: string): void;

  /**
   * Use another device's invitation, resolving with the group's id. Needs
   * the inviting device reachable right now. Rejects if the code isn't
   * one, was this device's own, has expired, or was already used.
   */
  join(code: string): Promise<string>;

  /** Release the wasm object. Reaching for it afterwards throws. */
  free(): void;
}

/** Where a {@link Device} comes from. */
export const Device: {
  /**
   * Open the device kept in the IndexedDB store called `store`, making it
   * if it isn't there, and bind an endpoint under its key.
   *
   * Doesn't wait for the network: what the device holds is usable offline.
   * `onRelayChange` is called with the home relay's URL whenever one
   * connects, and with `undefined` when none is. `onChange` is called with
   * a group's id whenever something in that group may read differently:
   * read it again.
   *
   * Rejects if the browser won't open the store, if another tab or worker
   * already has it open, or if the endpoint can't bind. {@link init} must
   * resolve before calling this.
   */
  open(
    store: string,
    onRelayChange: (homeRelay: string | undefined) => void,
    onChange: (group: string) => void,
  ): Promise<Device>;
};

/** Bytes or a compiled module to instantiate the wasm from. */
export type InitInput =
  RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

/**
 * Instantiate the module. With no argument the glue fetches the sibling
 * `.wasm`; pass bytes/a module/URL to control loading yourself. Must
 * resolve before anything else here is called.
 */
export default function init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<unknown>;
