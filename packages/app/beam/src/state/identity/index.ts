/**
 * This device: the address it answers on, the name it goes by, and the code
 * that hands both over.
 *
 * A row about yourself lives in the same table its peers do — an endpoint
 * with a name on it is the same kind of thing whoever it's about — but it
 * lands here rather than in the address book, so nothing that asks the book
 * about somebody else can be answered with yourself. The one read of the
 * contact store fills both.
 *
 * The key behind the address never reaches state. It's the private half of
 * this device's identity, it stays in the capability layer, and what comes
 * out of there is the public address the key implies.
 */
export {
  identityStore,
  identityResolvedTopic,
  deviceNamedTopic,
} from './identity';
export { deviceNameFormula, deviceFallbackFormula } from './formulas';
export { qrCodeCell } from './qr-code';
export { nameDeviceSaga, encodeInviteSaga } from './sagas';
