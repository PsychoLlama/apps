import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  Card,
  Flex,
  Heading,
  Inset as InsetComponent,
  type InsetProps,
  Text,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import * as css from './inset.stories.css';

const meta = {
  title: 'UI/Components',
  component: InsetComponent,
  args: {
    as: 'div',
    side: 'top',
    clip: 'border-box',
    pad: true,
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    side: {
      control: 'inline-radio',
      options: ['all', 'x', 'y', 'top', 'bottom', 'left', 'right'],
    },
    clip: {
      control: 'inline-radio',
      options: ['border-box', 'padding-box'],
    },
    pad: {
      control: 'boolean',
    },
  },
  render: (props) => (
    <Card as="div" size={2}>
      <InsetComponent {...props}>
        <Flex as="div" class={css.media} />
      </InsetComponent>
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

export const Inset: Story = {};
