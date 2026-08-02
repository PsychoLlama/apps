/**
 * What this device calls itself: one name, persisted to its own table in the
 * beam database and loaded into the scope once per session.
 *
 * Its own feature rather than part of the identity it travels with. The key
 * is minted by the browser and never seen by anyone; the name is chosen by
 * the reader, read by every peer, and saved by them under whatever they were
 * told — so it's a setting with a long life, and the flow that first asks for
 * it is only the first thing to ask.
 *
 * Not in the vault either. The vault holds the endpoint's secret key, which
 * is worth encrypting at rest because it *is* this device; a name that gets
 * advertised to strangers is not.
 */
export { selfLabelFormula } from './device';
export { nameDeviceSaga, restoreDeviceSaga } from './sagas';
