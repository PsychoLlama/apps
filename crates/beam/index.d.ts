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

  /** What this device is called in the group. Empty until it has said. */
  deviceName: string;
}

/** A device with a role in a group. */
export interface Member {
  /** The device's id, as a hex string. */
  id: string;

  /** What it calls itself. Empty until it has said. */
  name: string;

  /** Whether it's this device. */
  me: boolean;

  /** Whether it's reachable right now. This device always is. */
  online: boolean;
}

/** Something shared to a group. */
export interface Item {
  /**
   * The item's id within its group, as a hex string. Ids sort in the order
   * items were written.
   */
  id: string;

  /**
   * What was shared: a note or a link, as plain text. Empty for an item
   * that is a {@link Item.file}.
   */
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

  /** The file, for an item that is one. */
  file?: SharedFile;
}

/** A file shared to a group. */
export interface SharedFile {
  /**
   * What its author's device called it. Another device's word: show it,
   * and don't trust it as a path.
   */
  name: string;

  /** Its media type, as its author's device guessed. May be empty. */
  type: string;

  /** How many bytes it is. */
  size: number;

  /**
   * How many of them this device holds. Equal to {@link SharedFile.size}
   * once the file is here; it arrives as peers that have it are reachable.
   */
  held: number;
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

  /** Every group this device holds and hasn't put behind it, in id order. */
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

  /** The devices with a role in `group`, in id order. */
  members(group: string): Promise<Member[]>;

  /** Say what this device is called in `group`. */
  setDeviceName(group: string, name: string): Promise<void>;

  /** Call `group` something else, for every device in it. */
  renameGroup(group: string, name: string): Promise<void>;

  /**
   * Ask `group` to remove `device`. It happens when the group agrees,
   * which takes most of its devices being reachable. A device that learns
   * it was removed forgets the group and everything shared to it.
   */
  removeDevice(group: string, device: string): Promise<void>;

  /**
   * Be done with `group`. A device with no role forgets it at once; one
   * with a role asks to be removed and forgets it then; the last member
   * closes it.
   */
  leaveGroup(group: string): Promise<void>;

  /**
   * Start `group` over as a new group with only this device in it,
   * resolving with the new group's id. For a group that has lost, for
   * good, the devices it takes to agree on anything.
   */
  replaceGroup(group: string): Promise<string>;

  /**
   * Start bringing a file in, resolving with a handle to write its bytes
   * to. Nothing is shared until {@link Device.finishFile}; a file that
   * won't be finished should be {@link Device.abandonFile abandoned}.
   */
  beginFile(): Promise<number>;

  /** Take in the next bytes of a file, in order. Any amount at a time. */
  writeFile(file: number, bytes: Uint8Array): Promise<void>;

  /**
   * Share a file whose bytes are all in to `group`, as `name` and of
   * media type `type`.
   */
  finishFile(
    group: string,
    file: number,
    name: string,
    type: string,
  ): Promise<void>;

  /** Give up on a file that was begun, and let its bytes go. */
  abandonFile(file: number): Promise<void>;

  /**
   * Read a file's bytes from `offset`: as many as one step gives, and
   * fewer at its end, and none past it. `undefined` if `item` isn't a
   * file, or this device doesn't hold that part of it yet.
   */
  readFile(
    group: string,
    item: string,
    offset: number,
  ): Promise<Uint8Array | undefined>;

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
   *
   * Rejects with the message `left-behind` if this device was still in a
   * group the invitation's group replaced. It has left that group by
   * then, and the invitation is unspent: open the device again, and use
   * the invitation again.
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
   * read it again. `onFault` is called once, with why, if the store fails
   * while open: nothing works after that until the device is opened again.
   *
   * Rejects if the browser won't open the store, if another tab or worker
   * already has it open, or if the endpoint can't bind. {@link init} must
   * resolve before calling this.
   */
  open(
    store: string,
    onRelayChange: (homeRelay: string | undefined) => void,
    onChange: (group: string) => void,
    onFault: (reason: string) => void,
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
