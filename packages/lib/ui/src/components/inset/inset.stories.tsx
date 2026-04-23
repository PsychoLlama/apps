import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { marginArgTypes } from '../../props/margin';
import { testIdArgTypes } from '../../props/test-id';
import Card from '../card/card';
import Heading from '../heading/heading';
import Text from '../text/text';
import InsetComponent, { type InsetProps } from './inset';
import * as css from './inset.stories.css';

const meta = {
  title: 'UI/Layout',
  component: InsetComponent,
  args: {
    as: 'div',
    side: 'top',
    clip: 'border-box',
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
  },
  render: (props) => (
    <Card as="div" size={2}>
      <InsetComponent {...props} class={css.media} />
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
