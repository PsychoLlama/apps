import { createEffect, createRoot } from 'solid-js';
import { vi } from 'vitest';
import { ref, type Ref } from '../../ref';
import { createRegistry, GLOBAL_REGISTRY } from '../registry';
import { createStore, defineStore, destroyStore } from '../store';

interface Counter {
  count: number;
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));

describe('defineStore', () => {
  it('does not construct state at define time', () => {
    const init = vi.fn(() => ({ count: 0 }) satisfies Counter);
    const store = defineStore<Counter>(init);

    expect(init).not.toHaveBeenCalled();
    createStore(createRegistry(), store);
    expect(init).toHaveBeenCalledTimes(1);
  });
});

describe('createStore', () => {
  it('returns the initial state', () => {
    const registry = createRegistry();
    const state = createStore(registry, counterStore);
    expect(state.count).toBe(0);
  });

  it('types the returned state as deeply readonly', () => {
    const store = defineStore(() => ({ nested: { value: 1 } }));
    const state = createStore(createRegistry(), store);

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
    const state = createStore(createRegistry(), hostStore);

    // Ref is a plain class — Solid must not proxy its fields. Reading
    // `.current` should return the exact object passed to `ref(...)`.
    const current = state.handle?.current;
    expect(current).toBeDefined();
    expect(current?.value).toBe(1);
  });

  it('throws on double create in the same registry', () => {
    const registry = createRegistry();
    createStore(registry, counterStore);
    expect(() => createStore(registry, counterStore)).toThrow(
      /already created/i,
    );
  });

  it('isolates state across registries', () => {
    const a = createRegistry();
    const b = createRegistry();
    const stateA = createStore(a, counterStore);
    const stateB = createStore(b, counterStore);
    expect(stateA).not.toBe(stateB);
    expect(stateA.count).toBe(0);
    expect(stateB.count).toBe(0);
  });

  it('returns a reactive store', () => {
    const registry = createRegistry();
    const state = createStore(registry, counterStore);
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
      a: number;
      b: number;
    }
    const store = defineStore<Shape>(() => ({ a: 0, b: 0 }));
    const registry = createRegistry();
    const state = createStore(registry, store);

    let aRuns = 0;
    let bRuns = 0;
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        void state.a;
        aRuns += 1;
      });
      createEffect(() => {
        void state.b;
        bRuns += 1;
      });
      return dispose;
    });

    expect(aRuns).toBe(1);
    expect(bRuns).toBe(1);

    // Mutate `a` only — `b`'s effect should not rerun.
    const writable = state as Shape;
    writable.a = 5;
    expect(aRuns).toBe(2);
    expect(bRuns).toBe(1);

    dispose();
  });

  it('is backed by a mutable proxy (convention, not runtime enforcement, routes writes through actions)', () => {
    const registry = createRegistry();
    const state = createStore(registry, counterStore);

    // `createMutable` returns a directly-writable proxy. Mutations are
    // expected to flow through `invoke` for auditability — `DeepReadonly`
    // signals that at the type level — but nothing at runtime rejects a
    // direct write. This test pins that behavior so we notice if the
    // underlying primitive ever changes.
    const writable = state as Counter;
    writable.count = 42;
    expect(state.count).toBe(42);
  });
});

describe('destroyStore', () => {
  it('removes a store so it can be re-created', () => {
    const registry = createRegistry();
    createStore(registry, counterStore);
    destroyStore(registry, counterStore);
    expect(() => createStore(registry, counterStore)).not.toThrow();
  });

  it('throws if the store was never created', () => {
    const registry = createRegistry();
    expect(() => destroyStore(registry, counterStore)).toThrow(/not created/i);
  });
});

describe('GLOBAL_REGISTRY', () => {
  it('supports create and destroy like any other registry', () => {
    const oneOffStore = defineStore<Counter>(() => ({ count: 7 }));
    const state = createStore(GLOBAL_REGISTRY, oneOffStore);
    expect(state.count).toBe(7);
    destroyStore(GLOBAL_REGISTRY, oneOffStore);
  });
});
