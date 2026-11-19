/** Unit tests for the device worker's engine, over a fake lock manager. */

import type { Device, Group, Item } from '@crate/beam';
import { Engine, type EngineDeps, type EngineEvents } from '../engine';

const ID = 'a1b2c3d4e5f6';
const GROUP = 'aaaa';
const OTHER = 'bbbb';

const item = (id: string, body: string): Item => ({
  id,
  body,
  author: ID,
  createdAt: 0,
  committed: true,
});

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
  createGroup: vi.fn<Device['createGroup']>(() => Promise.resolve(GROUP)),
  groups: vi.fn<Device['groups']>(() => Promise.resolve<Group[]>([])),
  items: vi.fn<Device['items']>(() => Promise.resolve<Item[]>([])),
  addItem: vi.fn<Device['addItem']>(() => Promise.resolve()),
  deleteItem: vi.fn<Device['deleteItem']>(() => Promise.resolve()),
  invite: vi.fn<Device['invite']>(() => 'code'),
  cancelInvite: vi.fn<Device['cancelInvite']>(),
  join: vi.fn<Device['join']>(() => Promise.resolve(GROUP)),
});

const createEvents = () => ({
  opened: vi.fn<EngineEvents['opened']>(),
  heldElsewhere: vi.fn<EngineEvents['heldElsewhere']>(),
  openFailed: vi.fn<EngineEvents['openFailed']>(),
  relayChanged: vi.fn<EngineEvents['relayChanged']>(),
  groupsChanged: vi.fn<EngineEvents['groupsChanged']>(),
  feedChanged: vi.fn<EngineEvents['feedChanged']>(),
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

  it('lists the groups by name once open', async () => {
    const { engine, events, device } = setup();
    device.groups.mockResolvedValue([
      { id: 'b', name: 'Work', member: true },
      { id: 'a', name: 'Home', member: true },
    ]);

    engine.open();
    await settle();

    expect(events.groupsChanged).toHaveBeenCalledWith({
      groups: [
        { id: 'a', name: 'Home', member: true },
        { id: 'b', name: 'Work', member: true },
      ],
    });
  });

  it('pushes the watched group, and again when it changes', async () => {
    const { engine, events, device, deps } = setup();

    engine.open();
    await settle();

    device.items.mockResolvedValue([item('1', 'first')]);
    engine.watch(GROUP);
    await settle();

    expect(events.feedChanged).toHaveBeenLastCalledWith({
      groupId: GROUP,
      items: [item('1', 'first')],
    });

    device.items.mockResolvedValue([item('1', 'first'), item('2', 'second')]);
    const onChange = deps.openDevice.mock.calls[0][2];
    onChange(GROUP);
    await settle();

    expect(events.feedChanged).toHaveBeenLastCalledWith({
      groupId: GROUP,
      items: [item('1', 'first'), item('2', 'second')],
    });
  });

  it('says nothing about a group nobody is watching', async () => {
    const { engine, events, deps } = setup();

    engine.open();
    await settle();
    engine.watch(GROUP);
    await settle();
    events.feedChanged.mockClear();
    events.groupsChanged.mockClear();

    const onChange = deps.openDevice.mock.calls[0][2];
    onChange(OTHER);
    await settle();

    expect(events.feedChanged).not.toHaveBeenCalled();

    // The list is still read again: the change may be the group's name.
    expect(events.groupsChanged).toHaveBeenCalledOnce();
  });

  it('pushes a group watched before the device opened', async () => {
    const { engine, events, device } = setup();
    device.items.mockResolvedValue([item('1', 'first')]);

    engine.watch(GROUP);
    engine.open();
    await settle();

    expect(events.feedChanged).toHaveBeenCalledWith({
      groupId: GROUP,
      items: [item('1', 'first')],
    });
  });

  it('drops a read the page has moved on from', async () => {
    const { engine, events, device } = setup();
    const reading = Promise.withResolvers<Item[]>();

    engine.open();
    await settle();

    device.items.mockReturnValueOnce(reading.promise);
    engine.watch(GROUP);
    engine.watch(OTHER);
    reading.resolve([item('1', 'stale')]);
    await settle();

    expect(events.feedChanged).not.toHaveBeenCalledWith(
      expect.objectContaining({ groupId: GROUP }),
    );
  });

  it('hands writes to the device', async () => {
    const { engine, device } = setup();

    engine.open();
    await settle();

    await expect(engine.createGroup('Home')).resolves.toBe(GROUP);
    await engine.addItem(GROUP, 'hello');
    await engine.deleteItem(GROUP, '1');

    expect(device.createGroup).toHaveBeenCalledWith('Home');
    expect(device.addItem).toHaveBeenCalledWith(GROUP, 'hello');
    expect(device.deleteItem).toHaveBeenCalledWith(GROUP, '1');
  });

  it('hands invitations to the device', async () => {
    const { engine, device } = setup();

    engine.open();
    await settle();

    expect(engine.invite(GROUP)).toBe('code');
    engine.cancelInvite('code');
    await expect(engine.join('theirs')).resolves.toBe(GROUP);

    expect(device.invite).toHaveBeenCalledWith(GROUP);
    expect(device.cancelInvite).toHaveBeenCalledWith('code');
    expect(device.join).toHaveBeenCalledWith('theirs');
  });
});
