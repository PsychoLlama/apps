import { For, type JSX } from 'solid-js';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex, ScrollArea, Text, type ScrollAreaProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';
import * as css from './scroll-area.stories.css';

const SIZES = [1, 2] as const;
const TYPES = ['auto', 'always', 'hover'] as const;
const SCROLLBARS = ['vertical', 'horizontal', 'both'] as const;

const longText = Array.from(
  { length: 20 },
  (_unused, index) => `Line ${index + 1}`,
);
const tiles = Array.from({ length: 16 }, (_unused, index) => index);

const Frame = (props: { children: JSX.Element }) => (
  <Flex as="div" radius={3} background="surface" class={css.frame}>
    {props.children}
  </Flex>
);

const VerticalContent = () => (
  <Flex as="div" direction="column" gap={2} p={4}>
    <For each={longText}>
      {(line) => (
        <Text as="p" size={2}>
          {line}
        </Text>
      )}
    </For>
  </Flex>
);

const HorizontalContent = () => (
  <Flex as="div" direction="row" gap={3} p={4}>
    <For each={tiles}>
      {(tile) => <Flex as="div" radius={2} class={css.tile} data-tile={tile} />}
    </For>
  </Flex>
);

const meta = {
  title: 'UI/Components/ScrollArea',
  component: ScrollArea,
  args: {
    as: 'div',
    testId: 'scroll-area',
    type: 'auto',
    size: 1,
    scrollbars: 'both',
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    type: { control: 'inline-radio', options: ['auto', 'always', 'hover'] },
    size: { control: { type: 'range', min: 1, max: 2, step: 1 } },
    scrollbars: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal', 'both'],
    },
  },
  render: (props) => (
    <Frame>
      <ScrollArea {...props}>
        <VerticalContent />
      </ScrollArea>
    </Frame>
  ),
} satisfies Meta<ScrollAreaProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Frame>
          <ScrollArea as="div" size={size}>
            <VerticalContent />
          </ScrollArea>
        </Frame>
      )),
    },
    {
      title: 'Type',
      items: TYPES.map((type) => (
        <Frame>
          <ScrollArea as="div" type={type}>
            <Flex as="div" direction="column" gap={2} p={4}>
              <For each={longText.slice(0, 5)}>
                {(line) => (
                  <Text as="p" size={2}>
                    {type}: {line}
                  </Text>
                )}
              </For>
            </Flex>
          </ScrollArea>
        </Frame>
      )),
    },
    {
      title: 'Scrollbars',
      items: SCROLLBARS.map((scrollbars) => (
        <Frame>
          <ScrollArea as="div" scrollbars={scrollbars}>
            {scrollbars === 'horizontal' ? (
              <HorizontalContent />
            ) : (
              <VerticalContent />
            )}
          </ScrollArea>
        </Frame>
      )),
    },
  ],
});

export const Playground: Story = {};
