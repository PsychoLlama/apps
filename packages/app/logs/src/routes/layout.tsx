import { type JSX } from 'solid-js';
import { Frame } from '@lib/shell';

/**
 * The logs layout: the `<main>` frame for every `/logs/*` route. Each route
 * renders its own `LogsView` inside, so the breadcrumb can name the page in
 * view without the layout reverse-engineering the route.
 *
 * Beneath it, `./home` renders the archive index at `/logs`.
 */
const LogsLayout = (props: { children?: JSX.Element }) => (
  <Frame>{props.children}</Frame>
);

export default LogsLayout;
