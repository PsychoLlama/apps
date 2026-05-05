/**
 * Haptic effect tokens. Plain JS constants — these aren't CSS, so they
 * don't live under `tokens/` with the Vanilla Extract files.
 *
 * The vocabulary mirrors the Microsoft Edge Web Haptics explainer
 * (`hint`, `edge`, `tick`, `align`), which deliberately leaves
 * waveform values unspecified — the user agent translates each effect
 * to a native API (iOS UIImpactFeedbackGenerator, Android
 * HapticFeedbackConstants, etc). Source:
 * https://microsoftedge.github.io/MSEdgeExplainers/Haptics/explainer.html
 *
 * The web has no such bridge. We approximate each intent with a short
 * pattern compatible with `navigator.vibrate()` and the `web-haptics`
 * library's `Vibration[]` shape. When a real Web Haptics API ships,
 * swap call sites to `navigator.playHaptics(name, intensity)`.
 */

/**
 * One pulse in a haptic pattern. Matches `web-haptics`'s `Vibration`
 * type so tokens can be passed straight to `WebHaptics#trigger`.
 *
 * - `duration`: pulse length in ms.
 * - `intensity`: 0–1 amplitude. Most browsers ignore it (the underlying
 *   Vibration API is duration-only); meaningful on devices that expose
 *   the Web Haptics API.
 * - `delay`: gap before this pulse, in ms. Use to space repeated taps.
 */
export interface HapticPulse {
  duration: number;
  intensity?: number;
  delay?: number;
}

/** A haptic effect: an ordered sequence of pulses. */
export type HapticEffect = readonly HapticPulse[];

/**
 * Light, subtle cue. Signals an element is interactive or that an
 * action may follow. Reach for it on hover-equivalent gestures and
 * preview moments — it should be barely perceptible.
 */
export const hint: HapticEffect = [{ duration: 10, intensity: 0.4 }];

/**
 * Heavy boundary signal. Marks reaching the end of a range or hitting
 * a limit (scroll edges, slider clamps, disabled drop zones). Longer
 * and stronger than `tick` so it reads as "you cannot go further."
 */
export const edge: HapticEffect = [{ duration: 30, intensity: 1 }];

/**
 * Firm pulse for discrete state changes — moving through a list,
 * stepping a counter, toggling a switch. The default for "something
 * just changed by one unit." Shorter and crisper than `edge`.
 */
export const tick: HapticEffect = [{ duration: 15, intensity: 0.7 }];

/**
 * Crisp double-tap confirmation. Use when an object locks into place
 * or aligns with guides — snap-to-grid, magnetic snapping, successful
 * drop. The two pulses give it a distinct "click" feel.
 */
export const align: HapticEffect = [
  { duration: 8, intensity: 0.7 },
  { delay: 24, duration: 8, intensity: 0.9 },
];
