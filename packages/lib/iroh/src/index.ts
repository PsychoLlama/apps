/**
 * `@lib/iroh` — peer-to-peer networking over Iroh.
 *
 * A thin async API over the `@crate/iroh` wasm bindings: join the public relay
 * network, dial peers, and tear connections down. The endpoint's identity (its
 * secret key) is persisted through `@lib/vault` so it survives reloads,
 * encrypted at rest — handled internally, so consumers never touch the vault.
 *
 * These are plain promises with no framework coupling. The wasm fetch and
 * relay handshake are client-only (they can't run during SSG), so drive
 * {@link openConnection} from the client and pass an `AbortSignal` to cancel a
 * connect that's no longer needed.
 */
export { openConnection, dialPeer, closeConnection } from './connection';

/** The live endpoint handle joined to the relay network. */
export type { Connection } from '@crate/iroh';
