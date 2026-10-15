import { createSelfRouter, type Router } from './origins/self/router';

/**
 * The router for each origin the worker answers. Requests to any other
 * origin go to the network untouched.
 */
export const routers: ReadonlyMap<string, Router> = new Map([
  [self.location.origin, createSelfRouter()],
]);
