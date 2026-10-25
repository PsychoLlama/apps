import { pipe } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { defineCell } from '../cell';
import { defineExtension } from '../extension';
import { defineStore } from '../store';
import { defineTopic } from '../topic';

interface State {
  messages: string[];
}

describe('defineExtension', () => {
  it('writes stores and cells for each event', async () => {
    const $send = defineTopic<[message: string]>();
    const $store = defineStore<State>(() => ({ messages: [] }));
    const $count = defineCell(() => 0);
    const $extension = defineExtension(
      $send,
      [$store, $count],
      (store, [, setCount]) =>
        (message) => {
          store.messages.push(message);
          setCount((count) => count + 1);
        },
    );
    await using effects = createTestController();
    await effects.run($extension);
    const send = await effects.run($send);
    const store = await effects.run($store);
    const count = await effects.run($count);

    send('hello');
    send('world');

    expect(store.messages).toEqual(['hello', 'world']);
    expect(count()).toBe(2);
  });

  it('builds the commit once per subscription', async () => {
    const $send = defineTopic<[]>();
    const $count = defineCell(() => 0);
    const commit = vi.fn(() => () => {});
    await using effects = createTestController();
    await effects.run(defineExtension($send, [$count], commit));
    const send = await effects.run($send);

    send();
    send();

    expect(commit).toHaveBeenCalledOnce();
  });

  it('drops events while not held', async () => {
    const $send = defineTopic<[]>();
    const $count = defineCell(() => 0);
    const $extension = defineExtension(
      $send,
      [$count],
      ([, setCount]) =>
        () => {
          setCount((count) => count + 1);
        },
    );
    await using effects = createTestController();
    const send = await effects.run($send);
    const count = await effects.run($count);

    send();
    {
      await using compute = effects.use($extension);
      await compute();
      send();
    }
    send();

    expect(count()).toBe(1);
  });

  it('waits for async targets', async () => {
    const $send = defineTopic<[message: string]>();
    const $store = pipe([
      async () => ['seed'],
      defineStore((messages: string[]) => ({ messages })),
    ]);
    const $extension = defineExtension(
      $send,
      [$store],
      (store) => (message) => {
        store.messages.push(message);
      },
    );
    await using effects = createTestController();
    await effects.run($extension);
    const send = await effects.run($send);
    const store = await effects.run($store);

    send('hello');

    expect(store.messages).toEqual(['seed', 'hello']);
  });
});
