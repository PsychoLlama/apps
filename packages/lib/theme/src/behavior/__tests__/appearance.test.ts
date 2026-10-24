import { createTestController } from '@lib/effects/testing';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { $appearance } from '../appearance';

beforeEach(() => {
  localStorage.clear();
});

describe('$appearance', () => {
  it('hydrates the stored scheme', async () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance()).toBe('dark');
  });

  it('reads system when nothing is stored', async () => {
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance()).toBe('system');
  });

  it('reads system when the stored value is unrecognized', async () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'sepia');
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance()).toBe('system');
  });
});
