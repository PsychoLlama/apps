import { composeStories as base } from 'storybook/preview-api';
import {
  setProjectAnnotations,
  type SolidRenderer,
} from 'storybook-solidjs-vite';
import type { ComposedStoryFn } from 'storybook/internal/types';
import projectAnnotations from '../.storybook/preview';

const annotations = setProjectAnnotations([projectAnnotations]);

type Composed<TModule> = {
  [K in Exclude<keyof TModule, 'default' | '__esModule'> &
    string]: ComposedStoryFn<SolidRenderer>;
};

/**
 * Compose every story in a `*.stories.tsx` module with this project's
 * annotations applied. Returns a record of `ComposedStoryFn`s keyed by
 * the story export name; each entry exposes `.run()`, `.args`, and the
 * other portable-story affordances documented in Storybook.
 *
 * `storybook-solidjs-vite` doesn't ship its own typed `composeStories`,
 * so this wrapper just narrows the renderer to `SolidRenderer`. We
 * deliberately erase the per-story args type — TypeScript can resolve
 * the conditional inference through `StoriesWithPartialProps`, but
 * `typescript-eslint` reports it as unresolvable.
 */
export const composeStories = <TModule extends object>(
  stories: TModule,
): Composed<TModule> =>
  base(stories as never, annotations) as Composed<TModule>;
