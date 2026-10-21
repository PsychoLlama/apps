import { createTestController } from '@lib/effects/testing';
import { MOTION_ATTRIBUTE, THEME_ATTRIBUTE } from '../../constants';
import { $appearance, $appearanceChanged } from '../appearance';

describe('$appearance', () => {
  it('hydrates from the attributes the prelude stamped', async () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';
    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'reduce';
    onTestFinished(() => {
      delete document.documentElement.dataset[THEME_ATTRIBUTE];
      delete document.documentElement.dataset[MOTION_ATTRIBUTE];
    });
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance).toEqual({
      theme: 'jade',
      colorScheme: 'system',
      motion: 'reduce',
    });
  });
});

describe('$appearanceChanged', () => {
  it('updates one preference', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const appearanceChanged = await effects.run($appearanceChanged);

    appearanceChanged('colorScheme', 'dark');

    expect(appearance.colorScheme).toBe('dark');
  });
});
