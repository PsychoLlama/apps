import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import { Flex, Heading } from '@lib/ui';

/** A labeled row of pre-rendered component instances. */
export interface GallerySection {
  title: string;
  /** One JSX element per cell. Each tag is type-checked against its component. */
  items: ReadonlyArray<JSX.Element>;
}

/** Configuration for a `gallery()` story. */
export interface GalleryConfig {
  sections: ReadonlyArray<GallerySection>;
}

/**
 * Build a Storybook story that enumerates a component across labeled rows.
 *
 * Each section renders one horizontal row of pre-built JSX. Component
 * props are validated by the consumer's JSX tags directly — the gallery
 * just lays them out. Storybook controls are disabled because the args
 * are gallery-driven, not interactive.
 */
export const gallery = (config: GalleryConfig) => ({
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex as="section" direction="column" gap={6}>
      <For each={config.sections}>
        {(section) => (
          <Flex as="section" direction="column" gap={2}>
            <Heading as="h3" size={3} weight="medium" selectable={false}>
              {section.title}
            </Heading>
            <Flex as="div" wrap="wrap" align="center" gap={3}>
              <For each={section.items}>{(item) => item}</For>
            </Flex>
          </Flex>
        )}
      </For>
    </Flex>
  ),
});
