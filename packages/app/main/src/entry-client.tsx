// @refresh reload
import { hint } from '@lib/design';
import { mount, StartClient } from '@solidjs/start/client';
import workerUrl from '@app/service-worker?worker&url';

mount(() => <StartClient />, document.getElementById('app')!);

// POC: fire `hint` on every button-like press. Pointerdown (not click)
// so the buzz lands the moment the finger touches down, not after
// touchend resolves the tap. Delegated on document so we catch native
// `<button>`, ARIA buttons, and `<summary>` consistently without
// touching `@lib/ui`.
if (typeof navigator.vibrate === 'function') {
  const buttonSelector = 'button, [role="button"], summary';
  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(buttonSelector)) return;
    const pulse = hint[0];
    if (pulse) navigator.vibrate(pulse.duration);
  });
}

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
