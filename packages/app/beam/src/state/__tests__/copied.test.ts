import { createTestController } from '@lib/effects/testing';
import { $copied, $copyMarked } from '../copied';

describe('$copied', () => {
  it('starts with nothing copied', async () => {
    await using effects = createTestController();

    expect((await effects.run($copied))()).toBeNull();
  });

  it('holds the item that was copied until it is done saying so', async () => {
    await using effects = createTestController();
    const copied = await effects.run($copied);
    const copyMarked = await effects.run($copyMarked);

    copyMarked('note', true);
    expect(copied()).toBe('note');

    copyMarked('note', false);
    expect(copied()).toBeNull();
  });

  it('keeps the latest copy when an earlier one runs out', async () => {
    await using effects = createTestController();
    const copied = await effects.run($copied);
    const copyMarked = await effects.run($copyMarked);

    copyMarked('first', true);
    copyMarked('second', true);
    copyMarked('first', false);

    expect(copied()).toBe('second');
  });
});
