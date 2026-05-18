import type { Logger } from '@holz/core';

/**
 * Build the package's public `createLogger` over a pre-configured base
 * logger. The browser and server entry points each construct their own
 * pipeline and pass the result through here so the namespacing
 * behaviour stays identical across environments.
 */
export const buildCreateLogger =
  (baseLogger: Logger) =>
  (scope: readonly string[]): Logger =>
    scope.reduce<Logger>(
      (logger, segment) => logger.namespace(segment),
      baseLogger,
    );
