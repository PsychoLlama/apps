import { createTestController } from '@lib/effects/testing';
import { $removal, $removalAsked } from '../removal';

describe('$removal', () => {
  it('starts with nothing asked', async () => {
    await using effects = createTestController();

    expect((await effects.run($removal))()).toBeNull();
  });

  it('holds the device asked about until the question is put away', async () => {
    await using effects = createTestController();
    const removal = await effects.run($removal);
    const removalAsked = await effects.run($removalAsked);

    removalAsked('phone');
    expect(removal()).toBe('phone');

    removalAsked(null);
    expect(removal()).toBeNull();
  });
});
