// @refresh reload
import '@lib/theme/default';
import { mount, StartClient } from '@solidjs/start/client';
import workerUrl from '@app/service-worker?worker&url';

mount(() => <StartClient />, document.getElementById('app')!);

// Vite emits the bundled SW under `/_build/`, so its default scope
// would be limited to that prefix. The dev server (vite.config.ts)
// and the production edge (`public/_headers`) both set
// `Service-Worker-Allowed: /` to widen scope to the whole origin.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register(workerUrl, {
    type: 'module',
    scope: '/',
  });
}
