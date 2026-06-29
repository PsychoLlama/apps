// The package's public surface — a gate over a holz log stream that buffers
// while closed and flushes everything through on open.
export { createLogValve } from './holz-valve';
export type { LogValve, CreateLogValveOptions } from './holz-valve';
