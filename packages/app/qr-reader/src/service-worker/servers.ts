import { serveLocalOrigin } from '@lib/service-worker/serve';

type Server = (request: Request) => Promise<Response>;

/**
 * The server for each origin the worker answers. Requests to any other
 * origin go to the network untouched.
 */
export const servers: ReadonlyMap<string, Server> = new Map([
  [self.location.origin, serveLocalOrigin()],
]);
