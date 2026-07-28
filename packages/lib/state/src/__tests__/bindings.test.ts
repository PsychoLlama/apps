import { createRoot } from 'solid-js';
import {
  anchor as globalAnchor,
  createTestRuntime,
  peek as globalPeek,
  useCommit as globalUseCommit,
} from '../bindings';
import { defineFold } from '../fold';
import { commit, defineSaga } from '../saga';
import { defineScope } from '../scope';
import { defineCell, defineFormula, defineStore } from '../space';
import { defineTopic } from '../topic';

interface Counter {
  count: number;
}

const setup = () => {
  const scope = defineScope();
  const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
  const label = defineCell(scope, () => 'initial');
  const added = defineTopic<number>();

  defineFold(added, [counter], (draft, amount) => {
    draft.count += amount;
  });

  return { scope, counter, label, added, ...createTestRuntime() };
};

describe('bindRuntime', () => {
  it('useAnchor pins the scope to the reactive owner', () => {
    const { scope, counter, useAnchor, peek } = setup();

    createRoot((dispose) => {
      useAnchor(scope);
      expect(peek(counter).count).toBe(0);
      dispose();
    });

    expect(() => peek(counter)).toThrow(/dead scope/i);
  });

  it('useValue returns accessors for stores, cells, and formulas', () => {
    const { scope, counter, label, anchor, useValue } = setup();
    anchor(scope);
    const summary = defineFormula(
      [counter, label],
      (count, name) => `${name}:${count.count}`,
    );

    expect(useValue(counter)().count).toBe(0);
    expect(useValue(label)()).toBe('initial');
    expect(useValue(summary)()).toBe('initial:0');
  });

  it('useCommit publishes facts as one transition', () => {
    const { scope, counter, added, anchor, useCommit, peek, ledger } = setup();
    anchor(scope);

    const send = useCommit();
    send(added(2), added(3));

    expect(peek(counter).count).toBe(5);
    expect(ledger()).toEqual([[added(2), added(3)]]);
  });

  it('useRun forwards args and resolves with the return value', async () => {
    const { scope, counter, added, anchor, useRun, peek } = setup();
    anchor(scope);

    const bump = defineSaga(scope, async function* (amount: number) {
      yield commit(added(amount));
      return amount + 1;
    });

    await expect(useRun(bump)(4)).resolves.toBe(5);
    expect(peek(counter).count).toBe(4);
  });
});

describe('module-level bindings (global runtime)', () => {
  it('operate on the shared runtime', () => {
    const scope = defineScope();
    const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
    const added = defineTopic<number>();
    defineFold(added, [counter], (draft, amount) => {
      draft.count += amount;
    });

    const release = globalAnchor(scope);
    globalUseCommit()(added(2));

    expect(globalPeek(counter).count).toBe(2);

    release();
    expect(() => globalPeek(counter)).toThrow(/dead scope/i);
  });
});
