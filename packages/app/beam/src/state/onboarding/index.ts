/**
 * Setting a device up: a name for it, and a first device to use it with.
 *
 * Progress through the two steps is persisted to its own table rather than
 * inferred from what the device happens to own. Owning things is what setup
 * *produces*, not what it is, and reading it backwards meant a device could
 * be walked through setup again by losing something.
 *
 * The name itself belongs to `state/identity` — it's this device's, and it
 * outlives the flow that first asks for it. What lives here is the asking:
 * which step we're on, and what the form is holding while it's filled in.
 */
export { onboardingStore } from './progress';
export { setupDraftStore, setupNameChangedTopic } from './draft';
export {
  finishNamingSaga,
  finishPairingSaga,
  restoreOnboardingSaga,
} from './sagas';
