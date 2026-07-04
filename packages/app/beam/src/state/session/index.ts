/**
 * The `@lib/state` surface backing a beam session: the browser's relay
 * connection and the QR encoding of its beam link, landed together as the
 * connection comes up.
 */
export { connection } from './connection';
export { qrCode } from './qr-code';
export type { QrGrid } from './qr-code';
export { beamLink } from './capabilities';
export {
  openConnectionEffect,
  releaseConnectionEffect,
  dialPeerEffect,
} from './bindings';
