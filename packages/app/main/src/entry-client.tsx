// @refresh reload
import { mount, StartClient } from '@solidjs/start/client';
import { createLogger } from '@lib/observability';
import workerUrl from '@app/service-worker?worker&url';

mount(() => <StartClient />, document.getElementById('app')!);

// Vite emits the bundled SW under `/_build/`, so its default scope
// would be limited to that prefix. The dev server (vite.config.ts)
// and the production edge (`public/_headers`) both set
// `Service-Worker-Allowed: /` to widen scope to the whole origin.
if ('serviceWorker' in navigator) {
  const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE).namespace(
    'service-worker',
  );
  navigator.serviceWorker
    .register(workerUrl, { type: 'module', scope: '/' })
    .then(
      (registration) => {
        logger.info('Registered.', { scope: registration.scope });
      },
      (error) => {
        logger.error('Registration failed.', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      },
    );
}
