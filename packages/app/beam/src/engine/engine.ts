import type { Device, Group, Item, Member } from '@crate/beam';
import { assert } from '@lib/assert';
import { createLogger, toError } from '@lib/observability';

/**
 * This device, on the thread that owns it: the wasm module, the one handle
 * it mints, and the claim that keeps a second tab off the same store.
 *
 * The whole of the wasm boundary lives here. What crosses back to the page
 * is plain data, never a handle it would have to remember to free.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** The IndexedDB store the device is kept in. One per origin. */
const STORE = 'beam';

/**
 * The lock held for as long as this worker has the device.
 *
 * Woodland takes a lock of its own and refuses a second owner outright,
 * which says "no" but not "why". Holding ours first turns that into
 * something the page can show, and into a queue: a tab that loses waits,
 * and takes over when the winner closes.
 */
const LOCK = 'beam/device';

/**
 * How much of a file is read and handed to the database at a time. Large
 * enough that the hops are few, small enough that one is never much to
 * hold.
 */
const FILE_STEP = 4 * 1024 * 1024;

/**
 * A file was asked for that this device doesn't hold all of. Not a bug:
 * it arrives as the devices that have it are reachable.
 */
export class FileNotHeldError extends Error {
  override name = 'FileNotHeldError';

  constructor() {
    super('The file is not all here yet.');
  }
}

/** What the engine tells the page. All news, no answers. */
export interface EngineEvents {
  /** The device is open under this identity. */
  opened(device: { deviceId: string }): void;

  /** Another tab has the device. This one is now waiting for it. */
  heldElsewhere(): void;

  /** The device couldn't be opened. Terminal. */
  openFailed(failure: { reason: string }): void;

  /** The relay carrying this device changed, or went away. */
  relayChanged(change: { homeRelay: string | null }): void;

  /** The groups this device holds, whole, by name. Sent on open too. */
  groupsChanged(change: { groups: Group[] }): void;

  /**
   * Everything in the watched group, whole, oldest first. Sent when the
   * watch starts and whenever the group changes under it.
   */
  feedChanged(change: { groupId: string; items: Item[] }): void;

  /**
   * The devices in the watched group, whole. Sent with the feed, and
   * whenever one of them comes or goes.
   */
  membersChanged(change: { groupId: string; members: Member[] }): void;
}

/** What the engine needs from its surroundings, so a test can stand in. */
export interface EngineDeps {
  /** The Web Locks manager. */
  readonly locks: Pick<LockManager, 'request'>;

  /** Instantiate the wasm module. Called once, before the first open. */
  init(): Promise<unknown>;

  /** Open the device kept in `store`. */
  openDevice(
    store: string,
    onRelayChange: (homeRelay: string | undefined) => void,
    onChange: (group: string) => void,
  ): Promise<Device>;

  /**
   * What to call this device until someone says otherwise. A guess from
   * its surroundings, and deliberately a vague one.
   */
  defaultDeviceName(): string;
}

/** The state one worker holds for one page. */
export class Engine {
  readonly #deps: EngineDeps;
  readonly #events: EngineEvents;

  /** Ends the wait for a lock another tab holds. */
  readonly #waiting = new AbortController();

  #started = false;
  #closed = false;
  #device: Device | undefined;

  /** Lets the lock go. Set while it's held. */
  #release: (() => void) | undefined;

  /**
   * The group the page is looking at, if any. Only its feed is pushed:
   * the page has nowhere to put the others.
   */
  #watched: string | null = null;

  /** Groups this device is being named in right now. */
  readonly #naming = new Set<string>();

  constructor(deps: EngineDeps, events: EngineEvents) {
    this.#deps = deps;
    this.#events = events;
  }

  /**
   * Claim the device and open it, announcing how that goes. Returns at
   * once: the claim may wait on another tab for as long as that tab lives.
   *
   * Idempotent. A device opens once per worker.
   */
  open(): void {
    if (this.#started) return;
    this.#started = true;

    const { locks } = this.#deps;

    void locks
      .request(LOCK, { ifAvailable: true }, (lock) => {
        if (lock) return this.#hold();

        this.#events.heldElsewhere();

        // Queued behind the tab that has it, and deliberately not returned:
        // this callback holds nothing, and the wait may outlive it by hours.
        void locks
          .request(LOCK, { signal: this.#waiting.signal }, () => this.#hold())
          .catch((error: unknown) => this.#claimFailed(error));
      })
      .catch((error: unknown) => this.#claimFailed(error));
  }

  /**
   * Leave the network, let go of the store, and release the claim, in that
   * order, so the next tab in line opens a store nobody is holding.
   *
   * Terminal. The worker is expected to end after this resolves.
   */
  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    this.#waiting.abort();

    const device = this.#device;
    this.#device = undefined;

    try {
      await device?.close();
    } catch (error) {
      logger.warn('The device did not close cleanly.', {
        error: toError(error),
      });
    } finally {
      device?.free();
      this.#release?.();
    }
  }

  /**
   * Point the feed at `groupId`, or at nothing. Its items are pushed now,
   * if the device is open, and again whenever they change.
   *
   * May be called before the device opens: the feed follows the open.
   */
  watch(groupId: string | null): void {
    this.#watched = groupId;
    if (groupId === null) return;

    void this.#pushFeed(groupId);
    void this.#pushMembers(groupId);
  }

  /** Found a group called `name`, resolving with its id. */
  createGroup(name: string): Promise<string> {
    return this.#open().createGroup(name);
  }

  /** Share `body` to a group. */
  addItem(groupId: string, body: string): Promise<void> {
    return this.#open().addItem(groupId, body);
  }

  /** Delete an item from a group, for every device. */
  deleteItem(groupId: string, itemId: string): Promise<void> {
    return this.#open().deleteItem(groupId, itemId);
  }

  /**
   * Call this device `name`, in every group it's in. A device has one
   * name; each group keeps its own copy, since that's where the others
   * read it.
   */
  async renameDevice(name: string): Promise<void> {
    const device = this.#open();
    const groups = await device.groups();
    const mine = groups.filter((group) => group.member);

    await Promise.all(
      mine.map((group) => device.setDeviceName(group.id, name)),
    );
  }

  /** Call a group something else, for every device in it. */
  renameGroup(groupId: string, name: string): Promise<void> {
    return this.#open().renameGroup(groupId, name);
  }

  /** Ask a group to remove a device. */
  removeDevice(groupId: string, deviceId: string): Promise<void> {
    return this.#open().removeDevice(groupId, deviceId);
  }

  /** Be done with a group. */
  leaveGroup(groupId: string): Promise<void> {
    return this.#open().leaveGroup(groupId);
  }

  /**
   * Start a group over with only this device in it, resolving with the
   * new group's id.
   */
  replaceGroup(groupId: string): Promise<string> {
    return this.#open().replaceGroup(groupId);
  }

  /**
   * Share a file to a group. Its bytes are read from `file` a step at a
   * time, so its size is bounded by the store and not by memory.
   */
  async addFile(
    groupId: string,
    file: Blob,
    name: string,
    type: string,
  ): Promise<void> {
    const device = this.#open();
    const handle = await device.beginFile();

    try {
      for (let offset = 0; offset < file.size; offset += FILE_STEP) {
        const step = file.slice(offset, offset + FILE_STEP);
        await device.writeFile(
          handle,
          new Uint8Array(await step.arrayBuffer()),
        );
      }

      await device.finishFile(groupId, handle, name, type);
    } catch (error) {
      // Nothing refers to the bytes that made it in. Let them go.
      await device.abandonFile(handle).catch(() => undefined);
      throw error;
    }
  }

  /**
   * Read a whole file out of a group, of `size` bytes. Rejects if this
   * device doesn't hold all of it yet.
   *
   * Typed as bytes with no meaning: what a file claims to be is another
   * device's word, and nothing should act on it.
   */
  async readFile(groupId: string, itemId: string, size: number): Promise<Blob> {
    const device = this.#open();
    const parts: Uint8Array<ArrayBuffer>[] = [];

    let read = 0;
    while (read < size) {
      const part = await device.readFile(groupId, itemId, read);
      if (!part || part.length === 0) {
        throw new FileNotHeldError();
      }

      parts.push(new Uint8Array(part));
      read += part.length;
    }

    return new Blob(parts, { type: 'application/octet-stream' });
  }

  /**
   * Make an invitation to a group: a code for one other device to join
   * with, once.
   */
  invite(groupId: string): string {
    return this.#open().invite(groupId);
  }

  /** Take back an invitation that hasn't been used. */
  cancelInvite(code: string): void {
    this.#device?.cancelInvite(code);
  }

  /** Use another device's invitation, resolving with the group's id. */
  join(code: string): Promise<string> {
    return this.#open().join(code);
  }

  /** The open device. The page only offers these once it has opened. */
  #open(): Device {
    assert(this.#device, 'The device is not open.');
    return this.#device;
  }

  /** Send the page the list of groups, by name. */
  async #pushGroups(): Promise<void> {
    try {
      const groups = await this.#device?.groups();
      if (!groups) return;

      // By name, as people look for them. The id breaks ties, so two
      // groups with one name don't trade places between reads.
      groups.sort(
        (left, right) =>
          left.name.localeCompare(right.name) || (left.id < right.id ? -1 : 1),
      );
      this.#events.groupsChanged({ groups });
      this.#nameSelf(groups);
    } catch (error) {
      logger.error('Failed to read the groups.', { error: toError(error) });
    }
  }

  /**
   * Give this device a name in every group it's in and hasn't one for.
   *
   * Nobody is asked. The name is whatever it already goes by elsewhere,
   * or a guess, and can be changed whenever. A group it has just founded
   * or been let into gets here by being listed.
   */
  #nameSelf(groups: Group[]): void {
    const known = groups.find((group) => group.deviceName)?.deviceName;
    const unnamed = groups.filter(
      (group) =>
        group.member && !group.deviceName && !this.#naming.has(group.id),
    );

    for (const group of unnamed) {
      const name = known ?? this.#deps.defaultDeviceName();

      this.#naming.add(group.id);
      void this.#device
        ?.setDeviceName(group.id, name)
        .catch((error: unknown) => {
          logger.warn('Could not name this device in a group.', {
            groupId: group.id,
            error: toError(error),
          });
        })
        .finally(() => this.#naming.delete(group.id));
    }
  }

  /** Send the page a group's devices, if it's still the one watched. */
  async #pushMembers(groupId: string): Promise<void> {
    if (this.#watched !== groupId) return;

    try {
      const members = await this.#device?.members(groupId);
      if (!members || this.#watched !== groupId) return;

      this.#events.membersChanged({ groupId, members });
    } catch (error) {
      logger.error('Failed to read the devices in a group.', {
        groupId,
        error: toError(error),
      });
    }
  }

  /** Send the page a group's items, if it's still the one being watched. */
  async #pushFeed(groupId: string): Promise<void> {
    if (this.#watched !== groupId) return;

    try {
      const items = await this.#device?.items(groupId);

      // The page may have moved on while the read was out.
      if (!items || this.#watched !== groupId) return;

      this.#events.feedChanged({ groupId, items });
    } catch (error) {
      logger.error('Failed to read a group.', {
        groupId,
        error: toError(error),
      });
    }
  }

  /**
   * Hold the lock until released, opening the device under it. Called by
   * the lock manager once the claim is granted.
   */
  #hold(): Promise<void> {
    return new Promise<void>((release) => {
      this.#release = release;
      void this.#openDevice();
    });
  }

  async #openDevice(): Promise<void> {
    try {
      await this.#deps.init();

      const device = await this.#deps.openDevice(
        STORE,
        (homeRelay) => {
          this.#events.relayChanged({ homeRelay: homeRelay ?? null });
        },

        // A change says where to look, not what's there. Both views that
        // could show it are read again and sent whole.
        (groupId) => {
          void this.#pushGroups();
          void this.#pushFeed(groupId);
          void this.#pushMembers(groupId);
        },
      );

      // Closed while the store was opening. Nothing was told the device
      // exists, so it goes back the way `close` would have sent it.
      if (this.#closed) {
        await device.close();
        device.free();
        this.#release?.();
        return;
      }

      this.#device = device;
      logger.debug('Device opened.', { deviceId: device.id });
      this.#events.opened({ deviceId: device.id });

      void this.#pushGroups();
      if (this.#watched !== null) {
        void this.#pushFeed(this.#watched);
        void this.#pushMembers(this.#watched);
      }
    } catch (error) {
      const failure = toError(error);
      logger.error('Failed to open the device.', { error: failure });
      this.#release?.();
      this.#events.openFailed({ reason: failure.message });
    }
  }

  /** The lock manager refused, or the wait was called off by `close`. */
  #claimFailed(error: unknown): void {
    if (this.#closed) return;

    const failure = toError(error);
    logger.error('Failed to claim the device.', { error: failure });
    this.#events.openFailed({ reason: failure.message });
  }
}
