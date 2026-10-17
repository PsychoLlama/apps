import { DEFAULT_CONTROLLER } from './default';

/** The default controller's operations, for headless use. */
export const { acquire, compute, inspect, release, setSource } =
  DEFAULT_CONTROLLER;

export type { Handle } from '../manager';
