import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Card, Flex, Heading, Inset, type InsetProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import * as css from './inset.stories.css';

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
      <Heading as="h3" size={3} selectable>
        Insets bleed past padding
      </Heading>
      <Text as="p" size={2} selectable>
        The striped media above breaks out of the card's padding and rounds with
        the card's corners on its inset sides.
      </Text>
    </Card>
  ),
} satisfies Meta<InsetProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
