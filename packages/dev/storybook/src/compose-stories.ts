import { composeStories as base } from 'storybook/preview-api';
import type { SolidRenderer } from 'storybook-solidjs-vite';
import type {
  ComposedStoryFn,
  ProjectAnnotations,
  Renderer,
} from 'storybook/internal/types';

type Composed<TModule> = {
  [K in Exclude<keyof TModule, 'default' | '__esModule'> &
    string]: ComposedStoryFn<SolidRenderer>;
};

/**
 * Compose every story in a `*.stories.tsx` module with the project's
 * annotations applied. Returns a record of `ComposedStoryFn`s keyed by
 * the story export name; each entry exposes `.run()`, `.args`, and the
 * other portable-story affordances.
 *
 * `@storybook/addon-vitest` (≥10.3) auto-installs the project's preview
 * annotations onto `globalThis` before any test file loads, so we read
 * from there instead of calling `setProjectAnnotations` ourselves.
 *
 * `composeStories` from `storybook/preview-api` returns `{}` regardless
 * of input, and `storybook-solidjs-vite` doesn't ship its own typed
 * `composeStories`, so this wrapper threads `SolidRenderer` through.
 * Per-story args types are erased — `tsc` resolves the
 * `StoriesWithPartialProps` mapped type, but `typescript-eslint`
 * reports it as unresolvable, which forces `.run` and `.args` calls
 * into `no-unsafe-*` violations at every test site.
 */
export const composeStories = <TModule extends object>(
  stories: TModule,
): Composed<TModule> =>
  base(
    stories as never,
    globalThis.globalProjectAnnotations as ProjectAnnotations<Renderer>,
  ) as Composed<TModule>;
