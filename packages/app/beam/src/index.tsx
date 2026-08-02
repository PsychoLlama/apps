/**
 * `@app/beam` — peer-to-peer resource sharing over the iroh relay network.
 * `BeamLayout` is the `<main>` frame for every `/beam/*` route and holds the
 * relay connection open; beneath it `BeamHome` is the address book at `/beam`
 * — which is also where the invite opens, as a dialog over the list — and
 * `BeamShare` is everything about one peer at `/beam/share/:id`: the link it
 * lands on, the log, the composer, and the record itself.
 */
export { BeamLayout } from './components/beam-layout';
export { BeamHome } from './components/beam-home';
export { BeamShare } from './components/beam-share';
