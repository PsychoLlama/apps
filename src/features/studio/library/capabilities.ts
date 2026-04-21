/** Release the browser's reference to a blob URL. */
export function revokeRecording(url: string): void {
  URL.revokeObjectURL(url);
}
