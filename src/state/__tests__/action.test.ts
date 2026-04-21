import { createEffect, createRoot } from 'solid-js';
import { defineAction } from '../action';
import { bindRegistry } from '../bindings';
import { createRegistry } from '../registry';
import { defineStore } from '../store';

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
  const bound = bindRegistry(createRegistry());
  const counter = bound.createStore(counterStore);
  const log = bound.createStore(logStore);
  return { ...bound, counter, log };
}

describe('defineAction / useAction', () => {
  it('mutates a single store via its draft', () => {
    const { counter, useAction } = bootstrap();
    useAction(increment)(undefined);
    expect(counter.count).toBe(1);
  });

  it('passes input as the trailing handler argument', () => {
    const { counter, useAction } = bootstrap();
    useAction(addN)(5);
    useAction(addN)(3);
    expect(counter.count).toBe(8);
  });

  it('mutates multiple stores in one handler', () => {
    const { counter, log, useAction } = bootstrap();
    useAction(incrementAndLog)('hi');
    useAction(incrementAndLog)('again');
    expect(counter.count).toBe(2);
    expect(log.entries).toEqual(['hi:1', 'again:2']);
  });

  it('sees earlier writes in the same handler across stores', () => {
    const { counter, log, useAction } = bootstrap();

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
    const { counter, log, useAction } = bootstrap();

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
    const { useAction } = bindRegistry(createRegistry());
    expect(() => useAction(increment)(undefined)).toThrow(/not created/i);
  });
});
