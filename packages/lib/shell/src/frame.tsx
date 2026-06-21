import { type JSX } from 'solid-js';
import { Flex, type HtmlBoxTag } from '@lib/ui';
import * as css from './frame.css';

/**
 * The shell layout frame: a viewport-pinned `<main>` that traps the page
 * scroll so a header can stay fixed at the top while a {@link Body} scrolls
 * independently below it.
 *
 * Render it once per section — typically the route-segment layout — and let
 * each route fill it with a header (`SiteHeader`) and a `Frame.Body`. The
 * header sits in normal flow above the body and stays pinned for free; the
 * body owns the overflow so the page itself never scrolls. See
 * `frame.css.ts` for why the scroll is contained here rather than on the
 * document body.
 *
 * @example
 * // Route-segment layout — the persistent frame:
 * <Frame>{props.children}</Frame>
 *
 * // Per-route view — a header over the scrolling body:
 * <>
 *   <SiteHeader trail={trail} />
 *   <Frame.Body as="article">{content}</Frame.Body>
 * </>
 */
const Frame = (props: { children?: JSX.Element }) => (
  <Flex as="main" direction="column" class={css.frame}>
    {props.children}
  </Flex>
);

/**
 * The scrolling content region beneath the header, sized to fill the rest of
 * the {@link Frame}. Pass `as` to pick the semantic element for the region's
 * content (`article`, `section`, …); it defaults to a neutral `div`. Holds
 * its content off the viewport edges by the `inset` gutter — a horizontally
 * scrolling child can break flush to the edges by reading that var from
 * `@lib/shell/frame.css`.
 */
const Body = (props: { as?: HtmlBoxTag; children?: JSX.Element }) => (
  <Flex as={props.as ?? 'div'} direction="column" class={css.body}>
    {props.children}
  </Flex>
);

export default Object.assign(Frame, { Body });
