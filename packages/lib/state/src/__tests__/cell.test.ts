import { createComputed, createRoot } from 'solid-js';
import { pipe } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { createCell, defineCell, writable } from '../cell';

describe('defineCell', () => {
  it('seeds the value from init', async () => {
    const $cell = defineCell(() => 1);
    await using effects = createTestController();

    const count = await effects.run($cell);

    expect(count()).toBe(1);
  });

  it('shares one cell per seed', async () => {
    const $cell = defineCell((count: number) => count);
    await using effects = createTestController();

    const first = await effects.run(pipe([() => 1, $cell]));
    const again = await effects.run(pipe([() => 1, $cell]));
    const other = await effects.run(pipe([() => 2, $cell]));

    expect(again).toBe(first);
    expect(other).not.toBe(first);
    expect(other()).toBe(2);
  });

  it('starts fresh once released', async () => {
    const init = vi.fn(() => 0);
    const $cell = defineCell(init);
    {
      await using effects = createTestController();
      await effects.run($cell);
    }

    await using again = createTestController();
    await again.run($cell);

    expect(init).toHaveBeenCalledTimes(2);
  });

  it('hands readers an accessor, not a setter', async () => {
    const $cell = defineCell(() => 0);
    await using effects = createTestController();

    const count = await effects.run($cell);

    expect(count).toBeTypeOf('function');
    expect(count).toHaveLength(0);
  });

  it('notifies readers of writes through its signal', async () => {
    const $cell = defineCell(() => 0);
    await using effects = createTestController();
    const count = await effects.run($cell);
    const [read, write] = writable(count);

    const seen: number[] = [];
    const dispose = createRoot((dispose) => {
      createComputed(() => seen.push(count()));
      return dispose;
    });

    write(1);
    dispose();

    expect(read).toBe(count);
    expect(seen).toEqual([0, 1]);
  });

  it('refuses accessors that are not cells', () => {
    expect(() => writable(() => 0)).toThrow('Not a cell.');
  });
});

describe('createCell', () => {
  it('writes through the same signal commits recover', () => {
    const [count, setCount] = createCell(0);
    const [read, write] = writable(count);

    setCount(1);
    expect(read()).toBe(1);

    write(2);
    expect(count()).toBe(2);
  });
});
