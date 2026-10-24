import { useHead } from '@solidjs/meta';
import { createUniqueId } from 'solid-js';
import prelude from '../../prelude.ts?inline-script';

/**
 * Render-blocking and inlined (no extra fetch): restamps the `<html>`
 * preference attributes from their persisted values, falling through to
 * the SSG defaults on missing/invalid storage or when JS is disabled.
 *
 * `@solidjs/meta` has no `<Script>`, so this goes through `useHead`. Its
 * tags land in order, so render this after the theme-color tags it
 * swaps. They land after any stylesheets ahead of them, which the
 * script then waits on, but those block first paint anyway.
 */
export const Prelude = () => {
  useHead({
    tag: 'script',
    // Compiled at build time from our own source — not untrusted input.
    props: { children: prelude },
    // Escaping would mangle the source.
    setting: { close: true, escape: false },
    id: createUniqueId(),
  });

  return null;
};
