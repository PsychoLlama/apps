import {
  collect,
  pipe,
  reactive,
  type Plan,
  type Reactive,
  type Resource,
} from '@lib/effects';
import type { Accessor, Setter, Signal } from 'solid-js';
import { defineCommand } from '../command';
import { createCell, defineCell, type Cell } from '../cell';
import { defineExtension } from '../extension';
import { defineStore, type Store } from '../store';
import {
  defineTopic,
  type Publish,
  type Topic,
  type TopicValues,
} from '../topic';

interface State {
  message: string;
  tags: string[];
}

// Stands in for plans the examples don't need to build.
const never = <T>(): T => {
  throw new Error('Unreachable.');
};

describe('type safety', () => {
  it('defines stores from their initial state', () => {
    expectTypeOf(defineStore<State>).returns.toEqualTypeOf<
      Plan<void, Store<State>, 'sync'>
    >();

    const read = (store: Store<State>) => {
      // @ts-expect-error — stores are read-only outside commits
      store.message = 'nope';
      // @ts-expect-error — all the way down
      store.tags[0] = 'nope';
    };
    void read;
  });

  it('seeds stores from earlier steps', () => {
    const $theme = never<Plan<void, Reactive<string, 'sync'>, 'sync'>>();
    const $motion = never<Plan<void, Promise<boolean>, 'async'>>();

    const $store = pipe([
      collect([$theme, $motion]),
      defineStore(([theme, motion]: [Accessor<string>, boolean]) => ({
        theme: theme(),
        motion,
      })),
    ]);

    expectTypeOf($store).toEqualTypeOf<
      Plan<void, Store<{ theme: string; motion: boolean }>, 'async'>
    >();
  });

  it('defines cells for primitives', () => {
    expectTypeOf(defineCell(() => 0)).toEqualTypeOf<
      Plan<void, Reactive<number, 'sync', Cell<number>>, 'sync'>
    >();
  });

  it('targets plans that create their own cells', () => {
    const $send = defineTopic<[]>();
    const $cell = pipe([
      async () => 'seed',
      (seed: string) => {
        const [read] = createCell(seed.length);
        return reactive(read, () => {});
      },
    ]);

    const $extension = defineExtension($send, [$cell], (cell) => {
      expectTypeOf(cell).toEqualTypeOf<Signal<number>>();
      return () => {};
    });

    expectTypeOf($extension).toEqualTypeOf<
      Plan<void, Resource<void, 'sync'>, 'async'>
    >();
  });

  it('hands the creating step a writable view', () => {
    const [count, setCount] = createCell(0);

    expectTypeOf(count).toEqualTypeOf<Cell<number>>();
    expectTypeOf(setCount).toEqualTypeOf<Setter<number>>();
  });

  it('rejects plain objects and reactives as targets', () => {
    const $topic = defineTopic<[]>();
    const $object = never<Plan<void, State, 'sync'>>();
    const $reactive = never<Plan<void, Reactive<number, 'sync'>, 'sync'>>();

    const illegal = () => {
      // @ts-expect-error — not a store
      defineExtension($topic, [$object], () => () => {});
      // @ts-expect-error — not a cell
      defineExtension($topic, [$reactive], () => () => {});
    };
    void illegal;
  });

  it('extracts event arguments from topic plans', () => {
    const $send = defineTopic<[foo: boolean, bar: string]>();
    expectTypeOf($send).toEqualTypeOf<
      Topic<[foo: boolean, bar: string], 'sync'>
    >();
    expectTypeOf<TopicValues<typeof $send>>().toEqualTypeOf<
      [foo: boolean, bar: string]
    >();

    const illegal = (send: Publish<TopicValues<typeof $send>>) => {
      // @ts-expect-error — wrong arguments
      send('hello', true);
    };
    void illegal;
  });

  it('hands extensions the topic arguments and writable targets', () => {
    const $send = defineTopic<[message: string]>();
    const $store = defineStore<State>(() => ({ message: '', tags: [] }));
    const $cell = defineCell(() => 0);

    const $extension = defineExtension(
      $send,
      [$store, $cell],
      (store, cell) => {
        expectTypeOf(store).toEqualTypeOf<State>();
        expectTypeOf(cell).toEqualTypeOf<Signal<number>>();

        return (message) => {
          expectTypeOf(message).toEqualTypeOf<string>();
        };
      },
    );

    expectTypeOf($extension).toEqualTypeOf<
      Plan<void, Resource<void, 'sync'>, 'sync'>
    >();
  });

  it('lets commits ignore the event arguments', () => {
    const $send = defineTopic<[message: string]>();
    const $cell = defineCell(() => 0);

    defineExtension($send, [$cell], ([, setCount]) => () => {
      setCount((count) => count + 1);
    });
  });

  it('carries async targets into the extension', () => {
    const $send = defineTopic<[]>();
    const $store = pipe([
      async () => 'seed',
      defineStore((message: string) => ({ message })),
    ]);

    expectTypeOf(
      defineExtension($send, [$store], () => () => {}),
    ).toEqualTypeOf<Plan<void, Resource<void, 'sync'>, 'async'>>();
  });

  it('infers command arguments from the commit', () => {
    const $store = defineStore<State>(() => ({ message: '', tags: [] }));

    const $sendMessage = defineCommand(
      [$store],
      (store) => (message: string) => {
        expectTypeOf(store).toEqualTypeOf<State>();
        store.message = message;
      },
    );

    expectTypeOf($sendMessage).toEqualTypeOf<
      Topic<[message: string], 'sync'>
    >();
  });

  it('subscribes extensions to commands like any topic', () => {
    const $store = defineStore<State>(() => ({ message: '', tags: [] }));
    const $cell = defineCell(() => 0);
    const $sendMessage = defineCommand(
      [$store],
      (store) => (message: string) => {
        store.message = message;
      },
    );

    defineExtension($sendMessage, [$cell], ([, setCount]) => (message) => {
      expectTypeOf(message).toEqualTypeOf<string>();
      setCount((count) => count + 1);
    });
  });
});
