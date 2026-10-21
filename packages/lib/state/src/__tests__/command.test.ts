import { createTestController } from '@lib/effects/testing';
import { defineCommand } from '../command';
import { defineCell } from '../cell';
import { defineExtension } from '../extension';
import { defineStore } from '../store';

interface State {
  messages: string[];
}

describe('defineCommand', () => {
  it('commits each event to its targets', async () => {
    const $store = defineStore<State>(() => ({ messages: [] }));
    const $send = defineCommand([$store], (store) => (message: string) => {
      store.messages.push(message);
    });
    await using effects = createTestController();
    const send = await effects.run($send);
    const store = await effects.run($store);

    send('hello');

    expect(store.messages).toEqual(['hello']);
  });

  it('shares one publisher per controller', async () => {
    const $count = defineCell(() => 0);
    const $increment = defineCommand([$count], ([, setCount]) => () => {
      setCount((count) => count + 1);
    });
    await using effects = createTestController();

    const first = await effects.run($increment);
    const again = await effects.run($increment);
    first();

    expect(again).toBe(first);
    expect((await effects.run($count))()).toBe(1);
  });

  it('commits before extensions subscribed to it', async () => {
    const $store = defineStore<State>(() => ({ messages: [] }));
    const $seen = defineCell((): readonly string[] => []);
    const $send = defineCommand([$store], (store) => (message: string) => {
      store.messages.push(message);
    });
    const $echo = defineExtension(
      $send,
      [$store, $seen],
      (store, [, setSeen]) =>
        () =>
          setSeen([...store.messages]),
    );
    await using effects = createTestController();
    await effects.run($echo);
    const send = await effects.run($send);
    const seen = await effects.run($seen);

    send('hello');

    expect(seen()).toEqual(['hello']);
  });
});
