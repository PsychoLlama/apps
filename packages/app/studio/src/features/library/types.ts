/** A finalized recording available for playback or download. */
export interface Recording {
  /** Stable identifier assigned when the recording was finalized. */
  id: string;
  /** Human-readable label shown in the library. */
  name: string;
  /** Captured length in seconds. */
  duration: number;
  /** Epoch milliseconds of when the recording ended. */
  createdAt: number;
  /** Blob size in bytes. Drives the library's storage-usage readout. */
  size: number;
  /** Blob URL pointing at the captured video. */
  url: string;
}
