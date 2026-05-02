import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Flex, Heading } from '@lib/ui';

type RenderableComponent<P> = (props: P) => JSX.Element;

/**
 * One occurrence of the component within a section. The args are layered on
 * top of `base` and the section's `args`, so an item only needs to declare
 * what differs.
 */
export interface GalleryItem<P> {
  args: Partial<P>;
}

/**
 * A labeled row of components varying along a single dimension. `args` is
 * layered onto every item in the section — useful for shared overlays like
 * `{ disabled: true }`.
 */
export interface GallerySection<P> {
  title: string;
  args?: Partial<P>;
  items: ReadonlyArray<GalleryItem<P>>;
}

/** Configuration for a `gallery()` story. */
export interface GalleryConfig<P> {
  /** Args applied as the baseline for every item. */
  base?: Partial<P>;
  /** Ordered list of labeled rows. */
  sections: ReadonlyArray<GallerySection<P>>;
}

/**
 * Build a Storybook story that enumerates a component across labeled rows.
 *
 * Each section renders one horizontal row of the component. Args merge in
 * order: story args → `base` → `section.args` → `item.args`. Storybook
 * controls are disabled because the args are gallery-driven, not interactive.
 */
export const gallery = <P,>(
  component: RenderableComponent<P>,
  config: GalleryConfig<P>,
) => {
  const Comp = component as RenderableComponent<Record<string, unknown>>;
  return {
    parameters: { controls: { disable: true } },
    render: (storyArgs: P) => (
      <Flex as="section" direction="column" gap={6}>
        <For each={config.sections}>
          {(section) => (
            <Flex as="section" direction="column" gap={2}>
              <Heading as="h3" size={3} weight="medium" selectable={false}>
                {section.title}
              </Heading>
              <Flex as="div" wrap="wrap" align="center" gap={3}>
                <For each={section.items}>
                  {(item) => (
                    <Dynamic
                      component={Comp}
                      {...(storyArgs as Record<string, unknown>)}
                      {...(config.base as Record<string, unknown> | undefined)}
                      {...(section.args as Record<string, unknown> | undefined)}
                      {...(item.args as Record<string, unknown>)}
                    />
                  )}
                </For>
              </Flex>
            </Flex>
          )}
        </For>
      </Flex>
    ),
  };
};
