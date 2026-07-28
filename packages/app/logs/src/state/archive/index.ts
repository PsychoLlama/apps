/**
 * The on-device log archive: this device's persisted sessions, read back from
 * IndexedDB through a connection the viewer holds open for as long as it's on
 * screen.
 *
 * The archive is read once and then left alone. The backend pings a broadcast
 * channel whenever it persists more, which only flags the view stale — pulling
 * the newer tail in is the reader's call, through the header's refresh action.
 */
export { archiveStore } from './archive';
export { refreshArchiveSaga, trackArchiveSaga } from './sagas';
