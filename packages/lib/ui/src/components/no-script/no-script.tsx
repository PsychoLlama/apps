/**
 * NoScript component. No Radix equivalent — it exists to make the
 * `<noscript>` hydration hazard impossible to get wrong.
 *
 * The browser parses `<noscript>` children as raw text when scripting is
 * enabled, so the elements the server rendered inside it never become DOM
 * nodes on the client. Solid's hydration walks the markup expecting them and
 * mismatches. Wrapping the tag in `NoHydration` keeps the subtree out of the
 * hydration walk entirely: the server emits it, the client leaves it alone.
 */

import { NoHydration } from 'solid-js/web';
import type { JSX, ParentComponent } from 'solid-js';

export interface NoScriptProps {
  /**
   * Fallback markup for readers with scripting disabled. Rendered on the
   * server only — nothing inside ever hydrates, so event handlers and
   * reactive expressions are inert.
   */
  children?: JSX.Element;
}

/** Content shown only when scripting is unavailable. Renders a `<noscript>`. */
const NoScript: ParentComponent<NoScriptProps> = (props) => (
  <NoHydration>
    <noscript>{props.children}</noscript>
  </NoHydration>
);

export default NoScript;
