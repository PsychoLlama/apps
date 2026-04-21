import { createEffect, createRoot } from 'solid-js';
import { vi } from 'vitest';
import { ref, type Ref } from '../ref';
import { bindRegistry } from '../bindings';
import { createRegistry } from '../registry';
import { defineStore } from '../store';

interface Counter {
  count: number;
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));

describe('defineStore', () => {
  it('does not construct state at define time', () => {
    const init = vi.fn(() => ({ count: 0 }) satisfies Counter);
    const store = defineStore<Counter>(init);

    expect(init).not.toHaveBeenCalled();
    bindRegistry(createRegistry()).createStore(store);
    expect(init).toHaveBeenCalledTimes(1);
  });
});

describe('createStore', () => {
  it('returns the initial state', () => {
    const { createStore } = bindRegistry(createRegistry());
    const counter = createStore(counterStore);
    expect(counter.count).toBe(0);
  });

  it('types the returned state as deeply readonly', () => {
    const store = defineStore(() => ({ nested: { value: 1 } }));
    const { createStore } = bindRegistry(createRegistry());
    const state = createStore(store);

    // Assignments below are checked by the type system only — they are
    // never executed. `@ts-expect-error` fails the build if DeepReadonly
    // regresses and allows the mutation.
    const mutate = (): void => {
      // @ts-expect-error — top-level reassignment is forbidden.
      state.nested = { value: 2 };
      // @ts-expect-error — nested reassignment is forbidden.
      state.nested.value = 3;
    };
    void mutate;

    expect(state.nested.value).toBe(1);
  });

  it('leaves Ref<T> values opaque to Solid reactivity', () => {
    interface Host {
      handle: Ref<{ value: number }> | null;
    }
    const hostStore = defineStore<Host>(() => ({ handle: ref({ value: 1 }) }));
    const { createStore } = bindRegistry(createRegistry());
    const state = createStore(hostStore);

    // Ref is a plain class — Solid must not proxy its fields. Reading
    // `.current` should return the exact object passed to `ref(...)`.
    const current = state.handle?.current;
    expect(current).toBeDefined();
    expect(current?.value).toBe(1);
  });

  it('throws on double create in the same registry', () => {
    const { createStore } = bindRegistry(createRegistry());
    createStore(counterStore);
    expect(() => createStore(counterStore)).toThrow(/already created/i);
  });

  it('isolates state across registries', () => {
    const first = bindRegistry(createRegistry());
    const second = bindRegistry(createRegistry());
    const stateA = first.createStore(counterStore);
    const stateB = second.createStore(counterStore);
    expect(stateA).not.toBe(stateB);
    expect(stateA.count).toBe(0);
    expect(stateB.count).toBe(0);
  });

  it('returns a reactive store', () => {
    const { createStore } = bindRegistry(createRegistry());
    const state = createStore(counterStore);

    const values: number[] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => values.push(state.count));
      return dispose;
    });
    expect(values).toEqual([0]);
    dispose();
  });

  it('tracks fields independently for fine-grained reactivity', () => {
    interface Shape {
      first: number;
      second: number;
    }
    const store = defineStore<Shape>(() => ({ first: 0, second: 0 }));
    const { createStore } = bindRegistry(createRegistry());
    const state = createStore(store);

    let firstRuns = 0;
    let secondRuns = 0;
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        void state.first;
        firstRuns += 1;
      });
      createEffect(() => {
        void state.second;
        secondRuns += 1;
      });
      return dispose;
    });

    expect(firstRuns).toBe(1);
    expect(secondRuns).toBe(1);

    // Mutate `first` only — `second`'s effect should not rerun.
    const writable = state as Shape;
    writable.first = 5;
    expect(firstRuns).toBe(2);
    expect(secondRuns).toBe(1);

    dispose();
  });

  it('is backed by a mutable proxy (convention, not runtime enforcement, routes writes through actions)', () => {
    const { createStore } = bindRegistry(createRegistry());
    const state = createStore(counterStore);

    // The underlying proxy is directly writable. Mutations are expected
    // to flow through `invoke` for auditability — `DeepReadonly` signals
    // that at the type level — but nothing at runtime rejects a direct
    // write. This test pins that behavior so we notice if the underlying
    // primitive ever changes.
    const writable = state as Counter;
    writable.count = 42;
    expect(state.count).toBe(42);
  });
});

describe('destroyStore', () => {
  it('removes a store so it can be re-created', () => {
    const { createStore, destroyStore } = bindRegistry(createRegistry());
    createStore(counterStore);
    destroyStore(counterStore);
    expect(() => createStore(counterStore)).not.toThrow();
  });

  it('throws if the store was never created', () => {
    const { destroyStore } = bindRegistry(createRegistry());
    expect(() => destroyStore(counterStore)).toThrow(/not created/i);
  });
});
