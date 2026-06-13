import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  Flex,
  ScrollArea as ScrollAreaComponent,
  type ScrollAreaProps,
  Text,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import * as css from './scroll-area.stories.css';

const TYPES = ['auto', 'always', 'hover', 'scroll'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;
const SCROLLBARS = ['vertical', 'horizontal', 'both'] as const;

const BothContent = () => (
  <Flex as="div" direction="column" class={css.bothContent}>
    {Array.from({ length: 20 }, (_unused, index) => (
      <Text as="p" selectable>
        Row {index + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing
        elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam.
      </Text>
    ))}
  </Flex>
);

const meta = {
  title: 'UI/Components',
  component: ScrollAreaComponent,
  args: {
    testId: 'scroll-area',
    type: 'hover',
    size: 1,
    radius: 'full',
    scrollbars: 'both',
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    type: { control: 'inline-radio', options: [...TYPES] },
    scrollHideDelay: { control: { type: 'number', min: 0, step: 50 } },
    size: { control: { type: 'range', min: 1, max: 3, step: 1 } },
    radius: { control: 'inline-radio', options: [...RADII] },
    scrollbars: { control: 'inline-radio', options: [...SCROLLBARS] },
  },
  render: (args: ScrollAreaProps) => (
    <Flex as="div" class={css.playgroundFrame}>
      <ScrollAreaComponent {...args}>
        <BothContent />
      </ScrollAreaComponent>
    </Flex>
  ),
} satisfies Meta<ScrollAreaProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScrollArea: Story = {};
