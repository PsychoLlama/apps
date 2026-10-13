/**
 * The `@lib/state` surface backing the log viewer: the on-device archive,
 * owned by {@link logsScope}. The views anchor that scope and run the tracking
 * saga; releasing the last anchor is the whole teardown story.
 */
export { logsScope } from './scope';
export { reportSagaFailure } from './failure';
export { archiveStore, refreshArchiveSaga, trackArchiveSaga } from './archive';
