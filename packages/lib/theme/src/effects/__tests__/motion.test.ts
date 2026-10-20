import { createTestController } from '@lib/effects/testing';
import { MOTION_ATTRIBUTE, MOTION_STORAGE_KEY } from '../../constants';
import { $motion, $selectMotion } from '../motion';

// MutationObserver records arrive in a microtask.
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  delete document.documentElement.dataset[MOTION_ATTRIBUTE];
  localStorage.clear();
});

describe('$motion', () => {
  it('starts from the attribute the prelude stamped', async () => {
    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'reduce';
    await using effects = createTestController();

    const [motion] = await effects.run($motion);

    expect(motion()).toBe('reduce');
  });

  it("reads 'system' when there's no override", async () => {
    await using effects = createTestController();

    const [motion] = await effects.run($motion);

    expect(motion()).toBe('system');
  });

  it('follows later changes to the attribute', async () => {
    await using effects = createTestController();
    const [motion] = await effects.run($motion);

    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'no-preference';
    await flush();
    expect(motion()).toBe('no-preference');

    delete document.documentElement.dataset[MOTION_ATTRIBUTE];
    await flush();
    expect(motion()).toBe('system');
  });

  it('stops following once released', async () => {
    const effects = createTestController();
    const [motion] = await effects.run($motion);
    await effects[Symbol.asyncDispose]();

    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'reduce';
    await flush();

    expect(motion()).toBe('system');
  });
});

describe('$selectMotion', () => {
  it('writes the override through, echoing into $motion', async () => {
    await using effects = createTestController();
    const [motion] = await effects.run($motion);
    const [selectMotion] = await effects.run($selectMotion);

    selectMotion('reduce');
    await flush();

    expect(motion()).toBe('reduce');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('reduce');
  });
});
