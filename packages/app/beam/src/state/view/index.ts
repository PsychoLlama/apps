/**
 * What's on screen: which surface `/beam/*` is showing, and which modal is
 * open over it.
 *
 * Its own layer because none of it belongs to a domain. A rename form spans
 * the address book and this device's own row; the surface is a reading of how
 * far setup has got. Each one sits above the features it draws from and folds
 * their topics rather than being folded by them, so no feature has to know a
 * screen exists.
 *
 * Nothing here is persisted. It lives as long as the beam scope does, which is
 * as long as somebody is looking.
 */
export {
  inviteClosedTopic,
  inviteOpenedTopic,
  inviteStore,
  removalClosedTopic,
  removalOpenedTopic,
  removalStore,
  renameClosedTopic,
  renameOpenedTopic,
  renameStore,
} from './dialogs';
export type { RenameTarget } from './dialogs';
export { beamSurfaceFormula, surfaceForRoute } from './surface';
