const elapsedFormat = new Intl.DurationFormat('en', {
  style: 'digital',
  hours: '2-digit',
});

const durationFormat = new Intl.DurationFormat('en', { style: 'digital' });

const toDuration = (totalSeconds: number) => {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

/** Format elapsed time as `HH:MM:SS` for the recording timer. */
export const formatElapsed = (seconds: number): string =>
  elapsedFormat.format(toDuration(seconds));

/** Format a duration in a compact form for recording metadata. */
export const formatDuration = (seconds: number): string =>
  durationFormat.format(toDuration(seconds));

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Filesystem-safe download stem derived from when the recording ended.
 * The user-visible recording name includes locale punctuation (commas,
 * colons) that browsers sanitize unpredictably across platforms.
 */
export const filenameSlug = (epochMs: number): string => {
  const date = new Date(epochMs);
  const ymd = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
  const hms = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-');
  return `recording-${ymd}_${hms}`;
};
