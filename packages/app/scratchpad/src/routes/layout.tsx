import { type JSX } from 'solid-js';
import { Frame } from '@lib/shell';

/**
 * The scratchpad layout: the `<main>` frame for every `/scratchpad/*`
 * route. Each route renders its own header and body inside, so the
 * breadcrumb can name the experiment in view without the layout
 * reverse-engineering the active route.
 *
 * Beneath it, `./home` is the empty canvas at `/scratchpad` and each
 * sibling file is one branch-scoped experiment on its own route.
 */
const ScratchpadLayout = (props: { children?: JSX.Element }) => (
  <Frame>{props.children}</Frame>
);

export default ScratchpadLayout;
