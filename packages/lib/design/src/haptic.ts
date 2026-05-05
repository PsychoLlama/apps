/**
 * Haptic effect tokens. Plain JS constants — these aren't CSS, so they
 * don't live under `tokens/` with the Vanilla Extract files.
 *
 * The vocabulary mirrors the Microsoft Edge Web Haptics explainer
 * (`hint`, `tick`, `edge`, `align`), which deliberately leaves
 * waveform values unspecified — the user agent translates each effect
 * to a native API (iOS UIImpactFeedbackGenerator, Android
 * HapticFeedbackConstants, etc):
 * https://microsoftedge.github.io/MSEdgeExplainers/Haptics/explainer.html
 *
 * The web has no such bridge, so the patterns below are derived from
 * the Android side of the explainer's mapping table — that's the only
 * platform whose source we can read end-to-end. The chain:
 *
 *   1. The explainer maps each effect to a `HapticFeedbackConstants` ID.
 *   2. AOSP's `HapticFeedbackVibrationProvider#getVibrationForHapticFeedback`
 *      resolves that ID to a `VibrationEffect` (primitive or predefined).
 *   3. AOSP's default `VibrationConfig` resolves predefined effects to
 *      duration-only fallback patterns from `core/res/res/values/config.xml`.
 *
 * Sources (`platform_frameworks_base`, branch `main`):
 * - services/core/java/com/android/server/vibrator/HapticFeedbackVibrationProvider.java
 * - services/core/java/com/android/server/vibrator/VibrationSettings.java
 * - core/res/res/values/config.xml
 *
 * When a real Web Haptics API ships, swap call sites to
 * `navigator.playHaptics(name, intensity)` and treat these constants
 * as semantic labels only.
 */

/**
 * One pulse in a haptic pattern. Matches `web-haptics`'s `Vibration`
 * type so tokens can be passed straight to `WebHaptics#trigger`.
 *
 * - `duration`: pulse length in ms.
 * - `intensity`: 0–1 amplitude. Most browsers ignore it (the underlying
 *   Vibration API is duration-only); recorded here for forward
 *   compatibility with a real Web Haptics implementation.
 * - `delay`: gap before this pulse, in ms.
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
 * action may follow. The softest of the four — barely perceptible.
 *
 * AOSP: `GESTURE_THRESHOLD_DEACTIVATE` → `PRIMITIVE_TICK` at scale
 * `0.4`, falling back to `EFFECT_TEXTURE_TICK` (10ms).
 */
export const hint: HapticEffect = [{ duration: 8, intensity: 0.4 }];

/**
 * Soft pulse for discrete, frequently-repeated state changes — moving
 * through a list, scrubbing a slider, stepping a counter. Tuned to
 * stay comfortable when fired many times in a row.
 *
 * AOSP: `SEGMENT_FREQUENT_TICK` → `EFFECT_TEXTURE_TICK`, fallback 10ms.
 * The doc note: "expected to be very soft, so as not to be uncomfortable
 * when performed a lot in quick succession."
 */
export const tick: HapticEffect = [{ duration: 10, intensity: 0.5 }];

/**
 * Crisp confirmation for a deliberate, one-shot snap into place —
 * magnetic alignment, successful drop, lock-in. Slightly firmer than
 * `tick` so it reads as a single decisive event.
 *
 * AOSP: `SEGMENT_TICK` → `EFFECT_TICK`, fallback `config_clockTickVibePattern`
 * = `[0, 10]`. AOSP gives this the same fallback duration as `tick`;
 * we extend it to 12ms so the two are distinguishable through the
 * web's amplitude-blind Vibration API.
 */
export const align: HapticEffect = [{ duration: 12, intensity: 0.7 }];

/**
 * Heavy boundary signal. Marks reaching the end of a range or hitting
 * a limit — scroll edges, slider clamps, rejected drops. Longer than
 * the others so it reads as "you cannot go further."
 *
 * AOSP: `LONG_PRESS` → `EFFECT_HEAVY_CLICK`, fallback
 * `config_longPressVibePattern` = `[0, 30]`.
 */
export const edge: HapticEffect = [{ duration: 30, intensity: 1 }];
