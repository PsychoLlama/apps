import { createEffect, createRoot } from 'solid-js';
import { defineAction } from '../action';
import { bindRegistry } from '../bindings';
import { createRegistry } from '../registry';
import { createStore, defineStore } from '../store';

interface Counter {
  count: number;
}

interface Log {
  entries: string[];
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));
const logStore = defineStore<Log>(() => ({ entries: [] }));

const increment = defineAction([counterStore], (counter) => {
  counter.count += 1;
});

const addN = defineAction([counterStore], (counter, amount: number) => {
  counter.count += amount;
});

const incrementAndLog = defineAction(
  [counterStore, logStore],
  (counter, log, label: string) => {
    counter.count += 1;
    log.entries.push(`${label}:${counter.count}`);
  },
);

function bootstrap() {
  const registry = createRegistry();
  const bound = bindRegistry(registry);
  createStore(registry, counterStore);
  createStore(registry, logStore);
  return { registry, ...bound };
}

describe('defineAction / useAction', () => {
  it('mutates a single store via its draft', () => {
    const { useStore, useAction } = bootstrap();
    const counter = useStore(counterStore);
    useAction(increment)(undefined);
    expect(counter.count).toBe(1);
  });

  it('passes input as the trailing handler argument', () => {
    const { useStore, useAction } = bootstrap();
    const counter = useStore(counterStore);
    useAction(addN)(5);
    useAction(addN)(3);
    expect(counter.count).toBe(8);
  });

  it('mutates multiple stores in one handler', () => {
    const { useStore, useAction } = bootstrap();
    const counter = useStore(counterStore);
    const log = useStore(logStore);
    useAction(incrementAndLog)('hi');
    useAction(incrementAndLog)('again');
    expect(counter.count).toBe(2);
    expect(log.entries).toEqual(['hi:1', 'again:2']);
  });

  it('sees earlier writes in the same handler across stores', () => {
    const { useStore, useAction } = bootstrap();
    const counter = useStore(counterStore);
    const log = useStore(logStore);

    // Writes to counter must be visible to subsequent reads in the same
    // handler, including from a different store's logic.
    const crossStore = defineAction(
      [counterStore, logStore],
      (c, l, amount: number) => {
        c.count += amount;
        l.entries.push(`counter=${c.count}`);
        c.count += 1;
        l.entries.push(`counter=${c.count}`);
      },
    );

    useAction(crossStore)(10);
    expect(counter.count).toBe(11);
    expect(log.entries).toEqual(['counter=10', 'counter=11']);
  });

  it('batches multi-store updates into one reactive flush', () => {
    const { useStore, useAction } = bootstrap();
    const counter = useStore(counterStore);
    const log = useStore(logStore);

    let effectRuns = 0;
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        effectRuns += 1;
        void counter.count;
        void log.entries.length;
      });
      return dispose;
    });

    const baseline = effectRuns;
    useAction(incrementAndLog)('once');
    expect(effectRuns).toBe(baseline + 1);
    dispose();
  });

  it('throws when a required store is not created in the registry', () => {
    const registry = createRegistry();
    const { useAction } = bindRegistry(registry);
    expect(() => useAction(increment)(undefined)).toThrow(/not created/i);
  });
});
