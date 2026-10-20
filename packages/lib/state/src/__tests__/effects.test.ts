import { createTestController } from '@lib/effects/testing';
import { createTestRuntime } from '../bindings';
import { defineFold } from '../fold';
import { defineScope } from '../scope';
import { defineCell, defineStore } from '../space';
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

describe('anchored', () => {
  it('holds the scope alive while held', async () => {
    const { scope, counter, anchored, peek } = setup();

    {
      await using controller = createTestController();
      await controller.run(anchored(scope));

      expect(peek(counter).count).toBe(0);
    }

    expect(() => peek(counter)).toThrow(/dead scope/i);
  });
});

describe('observed', () => {
  it('reads a store, tracked', async () => {
    const { counter, added, observed, commit } = setup();
    await using controller = createTestController();

    const [read] = await controller.run(observed(counter));
    expectTypeOf(read().count).toEqualTypeOf<number>();
    expect(read().count).toBe(0);

    commit(added(2));

    expect(read().count).toBe(2);
  });

  it('reads a cell', async () => {
    const { label, observed } = setup();
    await using controller = createTestController();

    const [read] = await controller.run(observed(label));

    expect(read()).toBe('initial');
  });

  it('releases the scope once released', async () => {
    const { counter, observed, peek } = setup();

    {
      await using controller = createTestController();
      await controller.run(observed(counter));
    }

    expect(() => peek(counter)).toThrow(/dead scope/i);
  });

  it('keeps the scope alive while any effect holds it', async () => {
    const { counter, label, observed, peek } = setup();
    await using test = createTestController();
    const { acquire, compute, release } = test.controller;

    const store = acquire(observed(counter));
    const cell = acquire(observed(label));
    await Promise.all([compute(store), compute(cell)]);

    await release(store);
    expect(peek(counter).count).toBe(0);

    await release(cell);
    expect(() => peek(counter)).toThrow(/dead scope/i);
  });
});
