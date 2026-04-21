/**
 * High-level state of the recording session. Drives which UI panel
 * renders and which controls are enabled.
 *
 * - `idle`: no active capture; ready to start.
 * - `recording`: capture is live.
 * - `paused`: capture is frozen, elapsed holds.
 * - `stopping`: stop requested, waiting for the recorder to drain.
 * - `error`: last start attempt failed; the message lives in `error`.
 * - `unsupported`: the browser can't capture screens at all.
 */
export type SessionStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'error'
  | 'unsupported';

/** A single media input contributing to the recording. */
export interface Track {
  /** Stable identifier assigned when the track joins the session. */
  readonly id: string;
  /** Origin of the underlying stream. */
  readonly type: 'screen' | 'tab' | 'microphone' | 'system-audio';
  /** Human-readable label surfaced in the UI. */
  readonly label: string;
  /** `true` while the track is still producing data. */
  readonly live: boolean;
}
