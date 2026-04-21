export type SessionStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'error'
  | 'unsupported';

export interface Track {
  readonly id: string;
  readonly type: 'screen' | 'tab' | 'microphone' | 'system-audio';
  readonly label: string;
  readonly live: boolean;
}
