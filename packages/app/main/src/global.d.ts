/// <reference types="@solidjs/start/env" />

interface ImportMetaEnv {
  /**
   * Whether the experimental scratchpad app ships in this build. Baked
   * in at build time by the host's vite config from
   * `@dev/build/release`'s `includesExperimentalApp`, keeping the
   * launcher link and the prerendered route gate in lockstep.
   */
  readonly INCLUDE_EXPERIMENTAL_APP: boolean;
}

/**
 * Compiled, minified IIFE produced from `./theme-prelude.ts` by
 * `@dev/build/vite-plugin/inline-script`. Inlined into `<head>` by the
 * server entry so the persisted theme is stamped onto `<html>` before
 * paint, with no separate fetch.
 */
declare module 'virtual:theme-prelude' {
  const code: string;
  export default code;
}
