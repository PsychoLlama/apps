export type SessionStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'error'
  | 'unsupported';

export interface Track {
  id: string;
  type: 'screen' | 'tab' | 'microphone' | 'system-audio';
  label: string;
  live: boolean;
}
