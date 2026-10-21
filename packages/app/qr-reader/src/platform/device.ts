import type { Navigator } from '@solidjs/router';
import { resolveScanTarget } from '../scan-link';
import type { ScanResult } from '../worker/rpc';

/**
 * Fire a haptic pulse as tactile confirmation of a recognized code.
 * Guards on the Vibration API, which desktop browsers and iOS Safari
 * don't implement — a silent no-op there rather than a thrown call.
 */
export const vibrate = (pattern: VibratePattern): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

/**
 * Whether the app is running inside an installed PWA window rather than a
 * browser tab. Gates the scanned-link auto-open: only in standalone does
 * `window.open` hand the link to the real browser without replacing the
 * app, and only there is auto-navigating sensible — in a tab the user is
 * already browsing, we leave the result surface's link for them to tap.
 *
 * Tests the installable `display-mode`s the manifest can resolve to. The
 * media feature is Baseline-wide since 2020; iOS reports it from Safari
 * 15.4 on, so an older iOS home-screen app simply doesn't auto-open and
 * falls back to the rendered link — a benign miss, never a wrong navigation.
 */
const inStandalonePWA = (): boolean =>
  ['standalone', 'minimal-ui', 'fullscreen'].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  );

/**
 * Auto-launch a recognized link, but only inside an installed PWA. A
 * `url`-kind scan whose payload clears the {@link resolveScanTarget} safety
 * check launches so the common case — point, scan, go — needs no extra tap.
 * A link back into our own origin routes in-app through the router (no
 * reload, no new tab, session intact); anything else opens a new browser
 * tab, handing off to the real browser without replacing the app.
 *
 * In a plain browser tab we skip the auto-launch — the user is already
 * browsing — and leave the result surface's link for them to tap. Anything
 * unsafe or non-link is never launched. Even in a PWA a popup blocker may
 * swallow the new tab (it fires outside a fresh user gesture); that's fine,
 * the link is still there.
 */
export const launchScanTarget = (
  result: ScanResult,
  navigate: Navigator,
): void => {
  if (!inStandalonePWA()) return;

  const target = resolveScanTarget(result);
  if (target?.kind === 'internal') {
    navigate(target.path);
  } else if (target?.kind === 'external') {
    window.open(target.href, '_blank', 'noopener,noreferrer');
  }
};
