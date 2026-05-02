import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Card, Flex, Heading, Inset, type InsetProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';
import * as css from './inset.stories.css';

const SIDES = ['all', 'x', 'y', 'top', 'bottom', 'left', 'right'] as const;
const CLIPS = ['border-box', 'padding-box'] as const;

const Demo = (props: Partial<InsetProps<'div'>>) => (
  <Card as="div" size={1} style={{ width: '12rem' }}>
    <Inset as="div" testId="overview" {...props}>
      <Flex as="div" class={css.media} />
    </Inset>
    <Text as="p" size={1}>
      Card body
    </Text>
  </Card>
);

const meta = {
  title: 'UI/Components/Inset',
  component: Inset,
  args: {
    as: 'div',
    side: 'top',
    clip: 'border-box',
    pad: true,
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    side: {
      control: 'inline-radio',
      options: ['all', 'x', 'y', 'top', 'bottom', 'left', 'right'],
    },
    clip: {
      control: 'inline-radio',
      options: ['border-box', 'padding-box'],
    },
    pad: { control: 'boolean' },
  },
  render: (props) => (
    <Card as="div" size={2}>
      <Inset {...props}>
        <Flex as="div" class={css.media} />
      </Inset>
      <Heading as="h3" size={3}>
        Insets bleed past padding
      </Heading>
      <Text as="p" size={2}>
        The striped media above breaks out of the card's padding and rounds with
        the card's corners on its inset sides.
      </Text>
    </Card>
  ),
} satisfies Meta<InsetProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Side',
      items: SIDES.map((side) => <Demo side={side} />),
    },
    {
      title: 'Clip',
      items: CLIPS.map((clip) => <Demo side="top" clip={clip} />),
    },
    {
      title: 'Pad',
      items: [<Demo side="top" pad />, <Demo side="top" pad={false} />],
    },
  ],
});

export const Playground: Story = {};
