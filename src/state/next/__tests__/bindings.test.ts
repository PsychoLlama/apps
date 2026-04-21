import { defineAction } from '../action';
import {
  bindRegistry,
  useStore as globalUseStore,
  useAction as globalUseAction,
  useEffect as globalUseEffect,
} from '../bindings';
import { defineEffect } from '../effect';
import { createRegistry, GLOBAL_REGISTRY } from '../registry';
import { createStore, defineStore, destroyStore } from '../store';

interface Counter {
  count: number;
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));

const increment = defineAction([counterStore], (counter) => {
  counter.count += 1;
});

describe('bindRegistry', () => {
  it('returns helpers bound to the provided registry', () => {
    const registry = createRegistry();
    const { useStore, useAction } = bindRegistry(registry);
    createStore(registry, counterStore);

    const counter = useStore(counterStore);
    expect(counter.count).toBe(0);

    useAction(increment)(undefined);
    expect(counter.count).toBe(1);
  });

  it('isolates state across registries', () => {
    const a = createRegistry();
    const b = createRegistry();
    const boundA = bindRegistry(a);
    const boundB = bindRegistry(b);
    createStore(a, counterStore);
    createStore(b, counterStore);

    boundA.useAction(increment)(undefined);
    expect(boundA.useStore(counterStore).count).toBe(1);
    expect(boundB.useStore(counterStore).count).toBe(0);
  });

  it('wraps perform for async effects', async () => {
    const registry = createRegistry();
    const { useEffect } = bindRegistry(registry);

    const effect = defineEffect(
      (x: number): Promise<number> => Promise.resolve(x * 2),
    );
    await expect(useEffect(effect)(3)).resolves.toBeUndefined();
  });

  it('wraps perform for sync effects', () => {
    const registry = createRegistry();
    const { useEffect } = bindRegistry(registry);

    const fn = (x: number): number => x + 1;
    const effect = defineEffect(fn);
    const result: void = useEffect(effect)(1);
    expect(result).toBeUndefined();
  });
});

describe('module-level bindings (GLOBAL_REGISTRY)', () => {
  it('read and mutate the global registry', () => {
    const oneOff = defineStore<Counter>(() => ({ count: 0 }));
    const bumpOneOff = defineAction([oneOff], (c) => {
      c.count += 2;
    });

    createStore(GLOBAL_REGISTRY, oneOff);
    try {
      const counter = globalUseStore(oneOff);
      expect(counter.count).toBe(0);
      globalUseAction(bumpOneOff)(undefined);
      expect(counter.count).toBe(2);
    } finally {
      destroyStore(GLOBAL_REGISTRY, oneOff);
    }
  });

  it('exposes useEffect bound to the global registry', async () => {
    const oneOff = defineStore<Counter>(() => ({ count: 0 }));
    createStore(GLOBAL_REGISTRY, oneOff);
    try {
      const effect = defineEffect(
        (x: number): Promise<number> => Promise.resolve(x),
      );
      await expect(globalUseEffect(effect)(1)).resolves.toBeUndefined();
    } finally {
      destroyStore(GLOBAL_REGISTRY, oneOff);
    }
  });
});
