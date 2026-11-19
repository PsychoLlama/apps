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
  Device.open(
    store,
    () => {},
    onChange,
    () => {},
  );

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
      { id, name: 'My devices', member: true, deviceName: '' },
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
      {
        id: group,
        name: 'Notes',
        member: true,

        deviceName: '',
      },
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

  it('shares a file and reads it back, across steps and a restart', async () => {
    const store = storeName();
    const device = await open(store);
    const group = await device.createGroup('Files');

    // Larger than one step, so both the write and the read take several.
    const bytes = new Uint8Array(3 * 1024 * 1024 + 17);
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = (index * 31) % 251;
    }

    const handle = await device.beginFile();
    await device.writeFile(handle, bytes.slice(0, 1000));
    await device.writeFile(handle, bytes.slice(1000));
    await device.finishFile(group, handle, 'data.bin', 'application/x-test');

    const [item] = await device.items(group);
    expect(item).toMatchObject({
      body: '',
      committed: true,
      file: {
        name: 'data.bin',
        type: 'application/x-test',
        size: bytes.length,
        held: bytes.length,
      },
    });

    await device.close();
    device.free();

    const second = await open(store);
    const read = new Uint8Array(bytes.length);
    let offset = 0;
    while (offset < bytes.length) {
      const part = await second.readFile(group, item?.id ?? '', offset);
      if (!part) break;
      read.set(part, offset);
      offset += part.length;
    }

    expect(offset).toBe(bytes.length);
    expect(read.every((byte, index) => byte === bytes[index])).toBe(true);

    // Past the end there's nothing to give, which isn't the same as not
    // holding it.
    const past = await second.readFile(group, item?.id ?? '', offset);
    expect(past).toHaveLength(0);

    await second.close();
    second.free();
  });

  it('lets go of a file that is abandoned', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Files');

    const handle = await device.beginFile();
    await device.writeFile(handle, new Uint8Array([1, 2, 3]));
    await device.abandonFile(handle);
    await device.abandonFile(handle);

    await expect(device.finishFile(group, handle, 'gone', '')).rejects.toThrow(
      'no such file',
    );
    expect(await device.items(group)).toEqual([]);

    await device.close();
    device.free();
  });

  it('reads nothing from an item that is not a file', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Files');
    await device.addItem(group, 'a note');

    const [item] = await device.items(group);
    expect(item?.file).toBeUndefined();
    expect(await device.readFile(group, item?.id ?? '', 0)).toBeUndefined();

    await device.close();
    device.free();
  });

  it('lists itself as the only device of a group it founded', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    expect(await device.members(group)).toEqual([
      { id: device.id, name: '', me: true, online: true },
    ]);

    await device.close();
    device.free();
  });

  it('names itself in a group, and keeps the name', async () => {
    const store = storeName();
    const device = await open(store);
    const group = await device.createGroup('Notes');

    await device.setDeviceName(group, 'Laptop');
    await device.setDeviceName(group, 'Desk');

    expect(await device.members(group)).toMatchObject([{ name: 'Desk' }]);
    expect(await device.groups()).toMatchObject([{ deviceName: 'Desk' }]);

    await device.close();
    device.free();

    const second = await open(store);
    expect(await second.members(group)).toMatchObject([{ name: 'Desk' }]);

    await second.close();
    second.free();
  });

  it('renames a group', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    await device.renameGroup(group, 'Scratch');

    expect(await device.groups()).toMatchObject([
      { id: group, name: 'Scratch' },
    ]);

    await device.close();
    device.free();
  });

  it('closes a group its only device leaves, for good', async () => {
    const store = storeName();
    const device = await open(store);
    const group = await device.createGroup('Notes');
    const kept = await device.createGroup('Kept');

    await device.leaveGroup(group);

    expect(await device.groups()).toMatchObject([{ id: kept }]);

    await device.close();
    device.free();

    const second = await open(store);
    expect(await second.groups()).toMatchObject([{ id: kept }]);

    await second.close();
    second.free();
  });

  it('starts a group over, with what it had and only itself in it', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');
    await device.setDeviceName(group, 'Laptop');
    await device.addItem(group, 'carried over');

    const successor = await device.replaceGroup(group);

    expect(successor).not.toBe(group);

    // The old group is still held, and no longer listed.
    expect(await device.groups()).toMatchObject([
      { id: successor, name: 'Notes', member: true, deviceName: 'Laptop' },
    ]);
    expect(await device.items(successor)).toMatchObject([
      { body: 'carried over', committed: true },
    ]);
    expect(await device.members(successor)).toMatchObject([
      { id: device.id, name: 'Laptop', me: true },
    ]);

    await device.addItem(successor, 'written since');
    expect(await device.items(successor)).toHaveLength(2);

    await device.close();
    device.free();
  });

  it('refuses to remove the last device of a group', async () => {
    const device = await open(storeName());
    const group = await device.createGroup('Notes');

    await expect(device.removeDevice(group, device.id)).rejects.toThrow();
    await expect(device.removeDevice(group, 'nonsense')).rejects.toThrow(
      'not a device id',
    );

    await device.close();
    device.free();
  });

  it('keeps what it holds across the compaction every open does', async () => {
    const store = storeName();
    let device = await open(store);
    const group = await device.createGroup('Notes');
    await device.addItem(group, 'kept');
    await device.addItem(group, 'deleted');

    const handle = await device.beginFile();
    await device.writeFile(handle, new Uint8Array([1, 2, 3]));
    await device.finishFile(group, handle, 'kept.bin', '');

    const [, deleted] = await device.items(group);
    await device.deleteItem(group, deleted?.id ?? '');

    // Twice: once to shed the history, once over what's left.
    for (let round = 0; round < 2; round++) {
      await device.close();
      device.free();
      device = await open(store);
    }

    const items = await device.items(group);
    expect(items.map((item) => item.body)).toEqual(['kept', '']);
    expect(items[1]?.file).toMatchObject({ name: 'kept.bin', held: 3 });
    expect(await device.readFile(group, items[1]?.id ?? '', 0)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(await device.groups()).toMatchObject([{ id: group, name: 'Notes' }]);

    await device.close();
    device.free();
  });
});
