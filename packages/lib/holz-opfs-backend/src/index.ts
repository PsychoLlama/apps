// The realm-agnostic surface for reading persisted logs: file naming, the
// archive listing, and Web-Lock session tracking. Safe to evaluate anywhere,
// including server-side rendering — nothing here touches a browser/worker
// global at module load. The backend's realm-specific wiring (which does)
// lives behind `./main`, reached only by the logging host's browser processor.
export { LOG_DIRECTORY, LOG_FILE_NAME } from './log-file.ts';
export { listLogFiles, type LogFileInfo } from './log-archive.ts';
export { listActiveLogFiles } from './locks.ts';
