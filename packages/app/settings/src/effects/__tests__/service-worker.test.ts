import { createTestController } from '@lib/effects/testing';
import { $serviceWorkerActive } from '../service-worker';

// Stands in for `navigator.serviceWorker`, resolving `ready` on demand.
const stubServiceWorker = () => {
  const { promise, resolve } = Promise.withResolvers<void>();
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: promise },
  });

  onTestFinished(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  return { activate: resolve };
};

describe('$serviceWorkerActive', () => {
  it('stays inactive where service workers are unsupported', async () => {
    await using effects = createTestController();
    const active = await effects.run($serviceWorkerActive);

    expect(active()).toBe(false);
  });

  it('starts inactive until the worker activates', async () => {
    stubServiceWorker();
    await using effects = createTestController();
    const active = await effects.run($serviceWorkerActive);

    expect(active()).toBe(false);
  });

  it('turns active once the worker activates', async () => {
    const { activate } = stubServiceWorker();
    await using effects = createTestController();
    const active = await effects.run($serviceWorkerActive);

    activate();

    await expect.poll(active).toBe(true);
  });
});
