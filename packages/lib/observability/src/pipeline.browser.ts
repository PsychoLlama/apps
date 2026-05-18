import { createConsoleBackend } from '@holz/console-backend';
import { createLogger } from '@holz/core';
import { createEnvironmentFilter } from '@holz/env-filter';
import { createLogCollector } from '@holz/log-collector';

export const baseLogger = createLogger(
  createLogCollector({
    fallback: createEnvironmentFilter({
      processor: createConsoleBackend(),
      defaultPattern: '',
    }),
  }),
);
