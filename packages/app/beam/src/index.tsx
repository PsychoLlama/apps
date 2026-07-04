/**
 * `@app/beam` — peer-to-peer resource sharing over the iroh relay network.
 * `BeamLayout` is the `<main>` frame for every `/beam/*` route and holds the
 * relay connection open; `Beam` renders the sender's view at `/beam`, and
 * `BeamEndpoint` the (stubbed) peer view at `/beam/:endpoint`.
 */
export { BeamLayout } from './components/beam-layout';
export { Beam } from './components/beam-view';
export { BeamEndpoint } from './components/beam-endpoint';
