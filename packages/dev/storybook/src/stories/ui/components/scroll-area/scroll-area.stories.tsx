import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex, ScrollArea, type ScrollAreaProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';
import * as css from './scroll-area.stories.css';

const TYPES = ['auto', 'always', 'hover', 'scroll'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;
const SCROLLBARS = ['vertical', 'horizontal', 'both'] as const;

const TallContent = () => (
  <Flex as="div" direction="column" class={css.tallContent}>
    {Array.from({ length: 20 }, (_unused, index) => (
      <Text as="p">
        Line {index + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing
        elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Text>
    ))}
  </Flex>
);

const WideContent = () => (
  <Flex as="div" class={css.wideContent}>
    <Text as="p">
      A single very wide paragraph that overflows the viewport horizontally —
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </Text>
  </Flex>
);

const BothContent = () => (
  <Flex as="div" direction="column" class={css.bothContent}>
    {Array.from({ length: 20 }, (_unused, index) => (
      <Text as="p">
        Row {index + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing
        elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam.
      </Text>
    ))}
  </Flex>
);

const Demo = (props: Partial<ScrollAreaProps>) => (
  <Flex as="div" class={css.galleryCell}>
    <ScrollArea testId="overview" {...props}>
      <TallContent />
    </ScrollArea>
  </Flex>
);

const meta = {
  title: 'UI/Components/ScrollArea',
  component: ScrollArea,
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
      <ScrollArea {...args}>
        <BothContent />
      </ScrollArea>
    </Flex>
  ),
} satisfies Meta<ScrollAreaProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Type',
      items: TYPES.map((type) => <Demo type={type} />),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'Scrollbars',
      items: [
        <Flex as="div" class={css.galleryCell}>
          <ScrollArea testId="overview" scrollbars="vertical">
            <TallContent />
          </ScrollArea>
        </Flex>,
        <Flex as="div" class={css.galleryCell}>
          <ScrollArea testId="overview" scrollbars="horizontal">
            <WideContent />
          </ScrollArea>
        </Flex>,
        <Flex as="div" class={css.galleryCell}>
          <ScrollArea testId="overview" scrollbars="both">
            <BothContent />
          </ScrollArea>
        </Flex>,
      ],
    },
  ],
});

export const Playground: Story = {};
