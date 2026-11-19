/**
 * The wasm device against a real browser: IndexedDB under woodland, and an
 * iroh endpoint bound under the key the store holds.
 *
 * Nothing here waits on the network. Opening doesn't, by design.
 */

import init, { Device } from '@crate/beam';

/** A store no other test has had. */
const storeName = () => `beam-test-${crypto.randomUUID()}`;

const open = (store: string) => Device.open(store, () => {});

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
});
