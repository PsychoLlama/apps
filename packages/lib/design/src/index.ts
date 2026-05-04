/**
 * Public entry: registers the IBM Plex Sans web font, then re-exports
 * every runtime token from the V-E barrel.
 *
 * The font import is a plain `.css` side effect — Vite handles it
 * directly, hashing the woff2 assets and emitting `@font-face` rules
 * into the importing entry's CSS chunk. The V-E compile pipeline can't
 * load CSS files itself, so the font has to live outside the
 * `.css.ts` chain.
 */
import '@fontsource-variable/ibm-plex-sans/index.css';

export * from './index.css.ts';
