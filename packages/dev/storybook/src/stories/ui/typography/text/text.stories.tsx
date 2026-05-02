import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Text, type TextProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { trimArgTypes } from '@lib/ui/props/trim';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Typography/Text',
  component: Text,
  args: {
    children: 'Sphinx of black quartz, judge my vow',
    as: 'p',
    size: 3,
    ...skeletonArgs,
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['p', 'span', 'label', 'blockquote'],
    },
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
    },
    color: {
      control: 'inline-radio',
      options: ['highContrast', 'lowContrast'],
    },
    children: { control: 'text' },
    ...trimArgTypes,
    ...truncateArgTypes,
    ...marginArgTypes,
    ...selectableArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
  },
} satisfies Meta<TextProps<'p'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
