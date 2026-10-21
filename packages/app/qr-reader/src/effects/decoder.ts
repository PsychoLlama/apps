import { pipe, resource } from '@lib/effects';
import { createDecoder, terminateDecoder } from '../decoder';

/**
 * The decoder worker, once its wasm module is live, for as long as the plan
 * is held. Releasing it closes the RPC and reclaims the thread.
 *
 * Held by the whole reader page, so the module is warm before the camera
 * goes live and outlasts individual camera sessions.
 */
export const $decoder = pipe([
  async () => {
    const connection = await createDecoder();
    return resource(connection, () => terminateDecoder(connection));
  },
]);
