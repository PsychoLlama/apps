/**
 * `@app/share` — peer-to-peer resource sharing over the iroh relay network.
 * `ShareLayout` is the `<main>` frame for every `/share/*` route and holds the
 * relay connection open; `Share` renders the sharer's view at `/share`, and
 * `ShareEndpoint` the (stubbed) peer view at `/share/:endpoint`.
 */
export { ShareLayout } from './components/share-layout';
export { Share } from './components/share-view';
export { ShareEndpoint } from './components/share-endpoint';
