import type { Device } from '@crate/beam';
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
  ): Promise<Device>;
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

      const device = await this.#deps.openDevice(STORE, (homeRelay) => {
        this.#events.relayChanged({ homeRelay: homeRelay ?? null });
      });

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
