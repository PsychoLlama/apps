import { createEffect, createRoot } from 'solid-js';
import { createTestRuntime } from '../bindings';
import { defineFold } from '../fold';
import { defineScope } from '../scope';
import { defineCell, defineFormula, defineStore } from '../space';
import { defineTopic } from '../topic';

interface Counter {
  count: number;
}

interface Journal {
  entries: string[];
}

const setup = () => {
  const scope = defineScope();
  const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
  const journal = defineStore<Journal>(scope, () => ({ entries: [] }));
  const label = defineCell(scope, () => 'initial');

  const incremented = defineTopic();
  const added = defineTopic<number>();
  const renamed = defineTopic<string>();

  defineFold(incremented, [counter], (draft) => {
    draft.count += 1;
  });

  defineFold(added, [counter, journal], (draft, log, amount) => {
    draft.count += amount;
    log.entries.push(`added:${amount}`);
  });

  defineFold(renamed, [label], (draft, name) => {
    draft.current = name;
  });

  const bound = createTestRuntime();
  const release = bound.anchor(scope);

  return {
    ...bound,
    scope,
    counter,
    journal,
    label,
    incremented,
    added,
    renamed,
    release,
  };
};

describe('defineFold / commit', () => {
  it('folds a payload-less fact into its subscribed store', () => {
    const { commit, peek, counter, incremented } = setup();
    commit(incremented());
    expect(peek(counter).count).toBe(1);
  });

  it('delivers the payload as the trailing handler argument', () => {
    const { commit, peek, counter, journal, added } = setup();
    commit(added(5));
    expect(peek(counter).count).toBe(5);
    expect(peek(journal).entries).toEqual(['added:5']);
  });

  it('drafts cells through their box', () => {
    const { commit, peek, label, renamed } = setup();
    commit(renamed('next'));
    expect(peek(label)).toBe('next');
  });

  it('applies multiple facts in one commit in causal order', () => {
    const { commit, peek, counter, added } = setup();
    commit(added(2), added(3));
    expect(peek(counter).count).toBe(5);
  });

  it('flushes a multi-fact commit as a single reactive transition', () => {
    const { commit, useValue, counter, label, added, renamed } = setup();
    const count = useValue(counter);
    const name = useValue(label);
    let flushes = 0;

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        flushes += 1;
        void count().count;
        void name();
      });
      return dispose;
    });

    const baseline = flushes;
    commit(added(1), renamed('bulk'));

    expect(flushes).toBe(baseline + 1);
    dispose();
  });

  it('lets a second feature fold the same fact into its own store', () => {
    const { commit, peek, anchor, added } = setup();
    const other = defineScope();
    const audit = defineStore<Journal>(other, () => ({ entries: [] }));
    defineFold(added, [audit], (log, amount) => {
      log.entries.push(`audit:${amount}`);
    });
    anchor(other);

    commit(added(3));

    expect(peek(audit).entries).toEqual(['audit:3']);
  });

  it('skips folds whose scope is dead without dropping the rest', () => {
    const { commit, peek, counter, added } = setup();
    const other = defineScope();
    const audit = defineStore<Journal>(other, () => ({ entries: [] }));
    defineFold(added, [audit], (log, amount) => {
      log.entries.push(`audit:${amount}`);
    });

    // `other` is never anchored: the fact occurred, nobody alive cared.
    commit(added(4));
    expect(peek(counter).count).toBe(4);
  });

  it('records each commit in the ledger', () => {
    const { commit, ledger, incremented, renamed } = setup();
    commit(incremented());
    commit(renamed('x'), incremented());

    expect(ledger()).toEqual([[incremented()], [renamed('x'), incremented()]]);
  });

  it('reinitializes state when a scope is reborn', () => {
    const { commit, peek, counter, incremented, release, anchor, scope } =
      setup();
    commit(incremented());
    expect(peek(counter).count).toBe(1);

    release();
    anchor(scope);
    expect(peek(counter).count).toBe(0);
  });
});

describe('defineFormula', () => {
  it('derives values from stores and cells', () => {
    const { commit, peek, counter, label, added, renamed } = setup();
    const summary = defineFormula(
      [counter, label],
      (count, name) => `${name}:${count.count}`,
    );

    expect(peek(summary)).toBe('initial:0');

    commit(added(2), renamed('after'));
    expect(peek(summary)).toBe('after:2');
  });

  it('derives formulas from other formulas', () => {
    const { commit, peek, counter, added } = setup();
    const doubled = defineFormula([counter], (count) => count.count * 2);
    const quadrupled = defineFormula([doubled], (value) => value * 2);

    commit(added(3));
    expect(peek(quadrupled)).toBe(12);
  });

  it('re-runs consumers when a dependency changes', () => {
    const { commit, useValue, counter, added } = setup();
    const doubled = defineFormula([counter], (count) => count.count * 2);
    const view = useValue(doubled);
    const seen: number[] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        seen.push(view());
      });
      return dispose;
    });

    commit(added(1));
    commit(added(1));

    expect(seen).toEqual([0, 2, 4]);
    dispose();
  });
});
