import { DEFAULT_CONTROLLER } from './default';

/** The default controller's operations, for headless use. */
export const { acquire, compute, inspect, release } = DEFAULT_CONTROLLER;

export type { Handle } from '../manager';
