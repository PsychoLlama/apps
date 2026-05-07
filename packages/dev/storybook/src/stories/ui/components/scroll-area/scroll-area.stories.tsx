import { For } from 'solid-js';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex, ScrollArea, Text, type ScrollAreaProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';
import * as css from './scroll-area.stories.css';

const SIZES = [1, 2, 3] as const;
const TYPES = ['auto', 'always', 'hover'] as const;
const SCROLLBARS = ['vertical', 'horizontal', 'both'] as const;

const longText = Array.from(
  { length: 20 },
  (_unused, index) => `Line ${index + 1}`,
);
const tiles = Array.from({ length: 16 }, (_unused, index) => index);

const VerticalDemo = () => (
  <Flex as="div" class={css.frame}>
    <ScrollArea>
      <Flex as="div" class={css.stack}>
        <For each={longText}>
          {(line) => (
            <Text as="p" size={2}>
              {line}
            </Text>
          )}
        </For>
      </Flex>
    </ScrollArea>
  </Flex>
);

const HorizontalDemo = () => (
  <Flex as="div" class={css.frame}>
    <ScrollArea scrollbars="horizontal">
      <Flex as="div" class={css.wide}>
        <For each={tiles}>
          {(tile) => <Flex as="div" class={css.tile} data-tile={tile} />}
        </For>
      </Flex>
    </ScrollArea>
  </Flex>
);

const meta = {
  title: 'UI/Components/ScrollArea',
  component: ScrollArea,
  args: {
    testId: 'scroll-area',
    type: 'auto',
    size: 1,
    scrollbars: 'both',
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    type: { control: 'inline-radio', options: ['auto', 'always', 'hover'] },
    size: { control: { type: 'range', min: 1, max: 3, step: 1 } },
    scrollbars: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal', 'both'],
    },
  },
  render: (props) => (
    <Flex as="div" class={css.frame}>
      <ScrollArea {...props}>
        <Flex as="div" class={css.stack}>
          <For each={longText}>
            {(line) => (
              <Text as="p" size={2}>
                {line} — long enough to overflow horizontally when narrow.
              </Text>
            )}
          </For>
        </Flex>
      </ScrollArea>
    </Flex>
  ),
} satisfies Meta<ScrollAreaProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Flex as="div" class={css.frame}>
          <ScrollArea size={size}>
            <Flex as="div" class={css.stack}>
              <For each={longText}>
                {(line) => (
                  <Text as="p" size={2}>
                    {line}
                  </Text>
                )}
              </For>
            </Flex>
          </ScrollArea>
        </Flex>
      )),
    },
    {
      title: 'Type',
      items: TYPES.map((type) => (
        <Flex as="div" class={css.frame}>
          <ScrollArea type={type}>
            <Flex as="div" class={css.stack}>
              <For each={longText.slice(0, 5)}>
                {(line) => (
                  <Text as="p" size={2}>
                    {type}: {line}
                  </Text>
                )}
              </For>
            </Flex>
          </ScrollArea>
        </Flex>
      )),
    },
    {
      title: 'Scrollbars',
      items: SCROLLBARS.map((scrollbars) =>
        scrollbars === 'horizontal' ? <HorizontalDemo /> : <VerticalDemo />,
      ),
    },
  ],
});

export const Playground: Story = {};
