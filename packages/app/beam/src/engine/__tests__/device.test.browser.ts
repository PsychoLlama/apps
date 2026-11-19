/**
 * The wasm device against a real browser: IndexedDB under woodland, and an
 * iroh endpoint bound under the key the store holds.
 *
 * Nothing here waits on the network. Opening doesn't, by design.
 */

import init, { Device } from '@crate/beam';

/** A store no other test has had. */
const storeName = () => `beam-test-${crypto.randomUUID()}`;

const open = (store: string, onChange: (group: string) => void = () => {}) =>
  Device.open(store, () => {}, onChange);

beforeAll(async () => {
  await init();
});

describe('Device', () => {
  it('opens under a 32-byte identity', async () => {
    const device = await open(storeName());

    expect(device.id).toMatch(/^[0-9a-f]{64}$/);

    await device.close();
    device.free();
  });

  it('keeps its identity across a close and reopen', async () => {
    const store = storeName();

    const first = await open(store);
    const id = first.id;
    await first.close();
    first.free();

    const second = await open(store);
    expect(second.id).toBe(id);

    await second.close();
    second.free();
  });

  it('gives each store its own identity', async () => {
    const first = await open(storeName());
    const second = await open(storeName());

    expect(second.id).not.toBe(first.id);

    await Promise.all([first.close(), second.close()]);
    first.free();
    second.free();
  });

  it('refuses a store that is already open', async () => {
    const store = storeName();
    const device = await open(store);

    await expect(open(store)).rejects.toThrow();

    await device.close();
    device.free();
  });

  it('founds a group and lists it by name', async () => {
    const device = await open(storeName());

    const id = await device.createGroup('My devices');

    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(await device.groups()).toEqual([
      { id, name: 'My devices', member: true },
    ]);
    expect(await device.items(id)).toEqual([]);

    await device.close();
    device.free();
  });

  it('shares items oldest first, under this device as author', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    await device.addItem(group, 'first');
    await device.addItem(group, 'https://example.com/second');

    const items = await device.items(group);

    expect(items.map((item) => item.body)).toEqual([
      'first',
      'https://example.com/second',
    ]);

    expect(items[0]).toMatchObject({ author: device.id, committed: true });
    expect(items[0]?.createdAt).toBeGreaterThan(Date.now() - 60_000);

    await device.close();
    device.free();
  });

  it('deletes an item, and shrugs at one already gone', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    await device.addItem(group, 'keep');
    await device.addItem(group, 'drop');

    const drop = (await device.items(group))[1];
    assert(drop);
    await device.deleteItem(group, drop.id);
    await device.deleteItem(group, drop.id);

    const items = await device.items(group);
    expect(items.map((item) => item.body)).toEqual(['keep']);

    await device.close();
    device.free();
  });

  it('says which group changed', async () => {
    const changes: string[] = [];
    const device = await open(storeName(), (group) => changes.push(group));

    const group = await device.createGroup('Notes');
    expect(changes).toContain(group);

    changes.length = 0;
    await device.addItem(group, 'hello');
    expect(changes).toEqual([group]);

    await device.close();
    device.free();
  });

  it('keeps groups and items across a close and reopen', async () => {
    const store = storeName();

    const first = await open(store);
    const group = await first.createGroup('Notes');
    await first.addItem(group, 'still here');
    await first.close();
    first.free();

    const second = await open(store);

    expect(await second.groups()).toEqual([
      { id: group, name: 'Notes', member: true },
    ]);
    expect((await second.items(group)).map((item) => item.body)).toEqual([
      'still here',
    ]);

    await second.close();
    second.free();
  });

  it('keeps separate groups separate', async () => {
    const device = await open(storeName());
    const mine = await device.createGroup('Mine');
    const shared = await device.createGroup('Shared');

    await device.addItem(mine, 'private');

    expect(await device.items(shared)).toEqual([]);
    expect((await device.groups()).map((group) => group.name).sort()).toEqual([
      'Mine',
      'Shared',
    ]);

    await device.close();
    device.free();
  });

  it('makes an invitation naming this device', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    const code = device.invite(group);

    expect(code).toMatch(/^[0-9a-f]{96}$/);
    expect(code.startsWith(device.id)).toBe(true);
    expect(device.invite(group)).not.toBe(code);

    device.cancelInvite(code);
    device.cancelInvite('not a code');

    await device.close();
    device.free();
  });

  it('refuses a code that is not one, and its own', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    await expect(device.join('nonsense')).rejects.toThrow('not an invitation');
    await expect(device.join(device.invite(group))).rejects.toThrow(
      'this device made that invitation',
    );

    await device.close();
    device.free();
  });
});
