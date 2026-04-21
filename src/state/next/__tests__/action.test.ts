import { createEffect, createRoot } from 'solid-js';
import { defineAction, invoke } from '../action';
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

describe('defineAction / invoke', () => {
  it('mutates a single store via its draft', () => {
    const registry = createRegistry();
    const counter = createStore(registry, counterStore);
    invoke(registry, increment, undefined);
    expect(counter.count).toBe(1);
  });

  it('passes input as the trailing handler argument', () => {
    const registry = createRegistry();
    const counter = createStore(registry, counterStore);
    invoke(registry, addN, 5);
    invoke(registry, addN, 3);
    expect(counter.count).toBe(8);
  });

  it('mutates multiple stores in one handler', () => {
    const registry = createRegistry();
    const counter = createStore(registry, counterStore);
    const log = createStore(registry, logStore);
    invoke(registry, incrementAndLog, 'hi');
    invoke(registry, incrementAndLog, 'again');
    expect(counter.count).toBe(2);
    expect(log.entries).toEqual(['hi:1', 'again:2']);
  });

  it('sees earlier writes in the same handler across stores', () => {
    const registry = createRegistry();
    const counter = createStore(registry, counterStore);
    const log = createStore(registry, logStore);

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

    invoke(registry, crossStore, 10);
    expect(counter.count).toBe(11);
    expect(log.entries).toEqual(['counter=10', 'counter=11']);
  });

  it('batches multi-store updates into one reactive flush', () => {
    const registry = createRegistry();
    const counter = createStore(registry, counterStore);
    const log = createStore(registry, logStore);

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
    invoke(registry, incrementAndLog, 'once');
    expect(effectRuns).toBe(baseline + 1);
    dispose();
  });

  it('throws when a required store is not created in the registry', () => {
    const registry = createRegistry();
    expect(() => invoke(registry, increment, undefined)).toThrow(
      /not created/i,
    );
  });
});
