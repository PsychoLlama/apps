import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import {
  typeScale,
  fontFamily,
  fontWeight,
  headingLineHeight,
  type FontWeight,
} from '@lib/design';
import { Flex, Text } from '@lib/ui';

const meta = {
  title: 'Design System/Typography',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScale: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9] as const}>
        {(step) => {
          const scale = typeScale[step];
          return (
            <Flex as="div" direction="column">
              <Text as="p" size={1} color="lowContrast">
                typeScale[{step}]
              </Text>
              <Text
                as="p"
                color="highContrast"
                style={{
                  'font-size': scale.fontSize,
                  'line-height': scale.lineHeight,
                  'letter-spacing': scale.letterSpacing,
                }}
              >
                Sphinx of black quartz, judge my vow
              </Text>
            </Flex>
          );
        }}
      </For>
    </Flex>
  ),
};

export const HeadingLineHeight: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9] as const}>
        {(step) => {
          const scale = typeScale[step];
          const heading = headingLineHeight[step];
          return (
            <Flex as="div" direction="column">
              <Text as="p" size={1} color="lowContrast">
                headingLineHeight[{step}] (vs body)
              </Text>
              <Text
                as="p"
                color="highContrast"
                style={{
                  'font-size': scale.fontSize,
                  'line-height': heading,
                  'letter-spacing': scale.letterSpacing,
                }}
              >
                Sphinx of black quartz, judge my vow
              </Text>
            </Flex>
          );
        }}
      </For>
    </Flex>
  ),
};

export const FontFamilies: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={6}>
      <For
        each={[
          { name: 'fontFamily.body', value: fontFamily.body },
          { name: 'fontFamily.heading', value: fontFamily.heading },
          { name: 'fontFamily.code', value: fontFamily.code },
          { name: 'fontFamily.em', value: fontFamily.em },
          { name: 'fontFamily.quote', value: fontFamily.quote },
        ]}
      >
        {(item) => (
          <Flex as="div" direction="column">
            <Text as="p" size={1} color="lowContrast">
              {item.name}
            </Text>
            <Text
              as="p"
              size={6}
              color="highContrast"
              style={{ 'font-family': item.value }}
            >
              Sphinx of black quartz, judge my vow
            </Text>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={Object.entries(fontWeight) as Array<[FontWeight, string]>}>
        {([name, value]) => (
          <Flex as="div" direction="column">
            <Text as="p" size={1} color="lowContrast">
              fontWeight.{name} ({value})
            </Text>
            <Text
              as="p"
              size={6}
              color="highContrast"
              style={{ 'font-weight': value }}
            >
              Sphinx of black quartz, judge my vow
            </Text>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};
