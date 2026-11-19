/** Unit tests for the device worker's engine, over a fake lock manager. */

import type { Device } from '@crate/beam';
import { Engine, type EngineDeps, type EngineEvents } from '../engine';

const ID = 'a1b2c3d4e5f6';

/** Let every pending microtask and promise chain run. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

/**
 * Enough of Web Locks for one name: an exclusive lock, `ifAvailable`, a
 * queue of waiters, and a wait that an abort signal calls off.
 */
const createLocks = () => {
  let held = false;
  const queue: (() => void)[] = [];

  const run = async (callback: LockGrantedCallback<unknown>) => {
    held = true;

    try {
      return await callback({ name: 'lock', mode: 'exclusive' });
    } finally {
      held = false;
      queue.shift()?.();
    }
  };

  const request = (
    _name: string,
    options: LockOptions,
    callback: LockGrantedCallback<unknown>,
  ): Promise<unknown> => {
    if (!held) return run(callback);
    if (options.ifAvailable) return Promise.resolve(callback(null));

    return new Promise((resolve, reject) => {
      const grant = () => resolve(run(callback));
      queue.push(grant);

      options.signal?.addEventListener('abort', () => {
        queue.splice(queue.indexOf(grant), 1);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  };

  return {
    locks: { request } as EngineDeps['locks'],
    isHeld: () => held,
  };
};

const createDevice = () => ({
  id: ID,
  close: vi.fn(() => Promise.resolve()),
  free: vi.fn(),
  [Symbol.dispose]: vi.fn(),
});

const createEvents = () => ({
  opened: vi.fn<EngineEvents['opened']>(),
  heldElsewhere: vi.fn<EngineEvents['heldElsewhere']>(),
  openFailed: vi.fn<EngineEvents['openFailed']>(),
  relayChanged: vi.fn<EngineEvents['relayChanged']>(),
});

const setup = (locks = createLocks()) => {
  const device = createDevice();
  const events = createEvents();

  const deps = {
    locks: locks.locks,
    init: vi.fn(() => Promise.resolve()),
    openDevice: vi.fn<EngineDeps['openDevice']>(() =>
      Promise.resolve<Device>(device),
    ),
  };

  return { engine: new Engine(deps, events), deps, device, events, locks };
};

describe('Engine', () => {
  it('opens the device and announces its identity', async () => {
    const { engine, events, deps } = setup();

    engine.open();
    await settle();

    expect(deps.init).toHaveBeenCalledOnce();
    expect(events.opened).toHaveBeenCalledWith({ deviceId: ID });
    expect(events.heldElsewhere).not.toHaveBeenCalled();
  });

  it('opens once, however often it is asked', async () => {
    const { engine, deps } = setup();

    engine.open();
    engine.open();
    await settle();

    expect(deps.openDevice).toHaveBeenCalledOnce();
  });

  it('forwards relay changes, folding "none" to null', async () => {
    const { engine, events, deps } = setup();

    engine.open();
    await settle();

    const onRelayChange = deps.openDevice.mock.calls[0][1];
    onRelayChange('https://relay.example/');
    onRelayChange(undefined);

    expect(events.relayChanged.mock.calls).toEqual([
      [{ homeRelay: 'https://relay.example/' }],
      [{ homeRelay: null }],
    ]);
  });

  it('reports a failed open and lets the claim go', async () => {
    const { engine, events, deps, locks } = setup();
    deps.openDevice.mockRejectedValue(new Error('no storage'));

    engine.open();
    await settle();

    expect(events.openFailed).toHaveBeenCalledWith({ reason: 'no storage' });
    expect(locks.isHeld()).toBe(false);
  });

  it('closes the device before releasing the claim', async () => {
    const { engine, device, locks } = setup();

    engine.open();
    await settle();
    expect(locks.isHeld()).toBe(true);

    device.close.mockImplementation(() => {
      expect(locks.isHeld()).toBe(true);
      return Promise.resolve();
    });

    await engine.close();
    await settle();

    expect(device.close).toHaveBeenCalledOnce();
    expect(device.free).toHaveBeenCalledOnce();
    expect(locks.isHeld()).toBe(false);
  });

  it('waits for another tab, then takes over when it closes', async () => {
    const locks = createLocks();
    const first = setup(locks);
    const second = setup(locks);

    first.engine.open();
    await settle();

    second.engine.open();
    await settle();

    expect(second.events.heldElsewhere).toHaveBeenCalledOnce();
    expect(second.events.opened).not.toHaveBeenCalled();
    expect(second.deps.openDevice).not.toHaveBeenCalled();

    await first.engine.close();
    await settle();

    expect(second.events.opened).toHaveBeenCalledWith({ deviceId: ID });
  });

  it('stops waiting when closed, without reporting a failure', async () => {
    const locks = createLocks();
    const first = setup(locks);
    const second = setup(locks);

    first.engine.open();
    await settle();

    second.engine.open();
    await settle();

    await second.engine.close();
    await first.engine.close();
    await settle();

    expect(second.deps.openDevice).not.toHaveBeenCalled();
    expect(second.events.openFailed).not.toHaveBeenCalled();
    expect(locks.isHeld()).toBe(false);
  });

  it('hands back a device that finished opening after close', async () => {
    const { engine, events, deps, device, locks } = setup();
    const opening = Promise.withResolvers<Device>();
    deps.openDevice.mockReturnValue(opening.promise);

    engine.open();
    await settle();

    await engine.close();
    opening.resolve(device);
    await settle();

    expect(events.opened).not.toHaveBeenCalled();
    expect(device.close).toHaveBeenCalledOnce();
    expect(device.free).toHaveBeenCalledOnce();
    expect(locks.isHeld()).toBe(false);
  });
});
