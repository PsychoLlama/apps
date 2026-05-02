import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Container as ContainerComponent, type ContainerProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { swatches } from '../../../swatch';

const meta = {
  title: 'UI/Layout',
  component: ContainerComponent,
  args: {
    as: 'div',
    size: 4,
    align: 'center',
    children: swatches(1),
  },
  argTypes: {
    ...boxArgTypes,
    size: {
      control: 'inline-radio',
      options: [1, 2, 3, 4],
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    skeleton: { table: { disable: true } },
  },
} satisfies Meta<ContainerProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Container: Story = {};
