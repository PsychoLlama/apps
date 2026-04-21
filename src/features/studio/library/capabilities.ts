/** Release the browser's reference to a blob URL. */
export const revokeRecording = (url: string): void => {
  URL.revokeObjectURL(url);
};
