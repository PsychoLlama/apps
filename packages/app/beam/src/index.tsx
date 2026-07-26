/**
 * `@app/beam` — peer-to-peer resource sharing over the iroh relay network.
 * `BeamLayout` is the `<main>` frame for every `/beam/*` route and holds the
 * relay connection open; beneath it `BeamHome` is the address book at `/beam`,
 * `BeamInvite` shows this device's beam link at `/beam/invite`, `BeamShare` is
 * the peer view a beam link lands on at `/beam/share/:id`, and `BeamContact`
 * one peer's record at `/beam/contacts/:id`.
 */
export { BeamLayout } from './components/beam-layout';
export { BeamHome } from './components/beam-home';
export { BeamInvite } from './components/beam-invite';
export { BeamShare } from './components/beam-share';
export { BeamContact } from './components/beam-contact';
