/** Human-readable byte size. Uses binary (KB/MB/GB) for readability. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

/** Locale-aware date+time, or em dash when the timestamp is missing. */
export const formatDate = (timestamp: number): string => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};
