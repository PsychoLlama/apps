const elapsedFormat = new Intl.DurationFormat('en', {
  style: 'digital',
  hours: '2-digit',
});

const durationFormat = new Intl.DurationFormat('en', { style: 'digital' });

function toDuration(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** Format elapsed time as `HH:MM:SS` for the recording timer. */
export const formatElapsed = (seconds: number): string =>
  elapsedFormat.format(toDuration(seconds));

/** Format a duration in a compact form for recording metadata. */
export const formatDuration = (seconds: number): string =>
  durationFormat.format(toDuration(seconds));
