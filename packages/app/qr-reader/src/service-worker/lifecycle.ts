import { createLogger } from '@lib/observability';
import * as assets from '@lib/service-worker/assets';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Handles `install`. Pass to `waitUntil`: a rejection fails the install. */
export const install = async () => {
  await assets.download();

  logger.info('Service worker installed.', {
    serveFrom: assets.getManifest() === undefined ? 'network' : 'cache',
  });
};

/** Handles `activate`. Pass to `waitUntil`. */
export const activate = async () => {
  await assets.prune();

  logger.info('Service worker activated.');
};
