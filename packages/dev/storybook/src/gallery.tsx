import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Flex, Heading } from '@lib/ui';

type RenderableComponent<P> = (props: P) => JSX.Element;

/** A labeled row of component instances varying along a single dimension. */
export interface GallerySection<P> {
  title: string;
  /** Per-item args. Each entry renders one component instance. */
  args: ReadonlyArray<Partial<P>>;
}

/** Configuration for a `gallery()` story. */
export interface GalleryConfig<P> {
  /** Args applied as the baseline for every item across all sections. */
  base?: Partial<P>;
  /** Ordered list of labeled rows. */
  sections: ReadonlyArray<GallerySection<P>>;
}

/**
 * Build a Storybook story that enumerates a component across labeled rows.
 *
 * Each section renders one horizontal row of the component. Args merge in
 * order: story args → `base` → item args. Storybook controls are disabled
 * because the args are gallery-driven, not interactive.
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
                <For each={section.args}>
                  {(itemArgs) => (
                    <Dynamic
                      component={Comp}
                      {...(storyArgs as Record<string, unknown>)}
                      {...(config.base as Record<string, unknown> | undefined)}
                      {...(itemArgs as Record<string, unknown>)}
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
