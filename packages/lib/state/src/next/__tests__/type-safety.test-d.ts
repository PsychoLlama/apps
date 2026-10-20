import {
  collect,
  pipe,
  type Plan,
  type Reactive,
  type Resource,
} from '@lib/effects';
import type { Accessor, Signal } from 'solid-js';
import { defineAction } from '../action';
import { defineCell, type Cell } from '../cell';
import { defineChange } from '../change';
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
      Plan<[], [Store<State>], 'sync'>
    >();

    const read = (store: Store<State>) => {
      // @ts-expect-error — stores are read-only outside changes
      store.message = 'nope';
      // @ts-expect-error — all the way down
      store.tags[0] = 'nope';
    };
    void read;
  });

  it('seeds stores from earlier steps', () => {
    const $theme = never<Plan<[], [Reactive<string, 'sync'>], 'sync'>>();
    const $motion = never<Plan<[], [Promise<boolean>], 'async'>>();

    const $store = pipe([
      collect([$theme, $motion]),
      defineStore(([theme, motion]: [Accessor<string>, boolean]) => ({
        theme: theme(),
        motion,
      })),
    ]);

    expectTypeOf($store).toEqualTypeOf<
      Plan<[], [Store<{ theme: string; motion: boolean }>], 'async'>
    >();
  });

  it('defines cells for primitives', () => {
    expectTypeOf(defineCell(() => 0)).toEqualTypeOf<
      Plan<[], [Cell<number>], 'sync'>
    >();
  });

  it('rejects plain objects and reactives as targets', () => {
    const $topic = defineTopic<[]>();
    const $object = never<Plan<[], [State], 'sync'>>();
    const $reactive = never<Plan<[], [Reactive<number, 'sync'>], 'sync'>>();

    const illegal = () => {
      // @ts-expect-error — not a store
      defineChange($topic, [$object], () => () => {});
      // @ts-expect-error — not a cell
      defineChange($topic, [$reactive], () => () => {});
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

  it('hands changes the topic arguments and writable targets', () => {
    const $send = defineTopic<[message: string]>();
    const $store = defineStore<State>(() => ({ message: '', tags: [] }));
    const $cell = defineCell(() => 0);

    const $change = defineChange($send, [$store, $cell], (store, cell) => {
      expectTypeOf(store).toEqualTypeOf<State>();
      expectTypeOf(cell).toEqualTypeOf<Signal<number>>();

      return (message) => {
        expectTypeOf(message).toEqualTypeOf<string>();
      };
    });

    expectTypeOf($change).toEqualTypeOf<
      Plan<[], [Resource<void, 'sync'>], 'sync'>
    >();
  });

  it('carries async targets into the change', () => {
    const $send = defineTopic<[]>();
    const $store = pipe([
      async () => 'seed',
      defineStore((message: string) => ({ message })),
    ]);

    expectTypeOf(defineChange($send, [$store], () => () => {})).toEqualTypeOf<
      Plan<[], [Resource<void, 'sync'>], 'async'>
    >();
  });

  it('infers action arguments from the commit', () => {
    const $store = defineStore<State>(() => ({ message: '', tags: [] }));

    const $sendMessage = defineAction(
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

  it('subscribes changes to actions like any topic', () => {
    const $store = defineStore<State>(() => ({ message: '', tags: [] }));
    const $cell = defineCell(() => 0);
    const $sendMessage = defineAction(
      [$store],
      (store) => (message: string) => {
        store.message = message;
      },
    );

    defineChange($sendMessage, [$cell], ([, setCount]) => (message) => {
      expectTypeOf(message).toEqualTypeOf<string>();
      setCount((count) => count + 1);
    });
  });
});
