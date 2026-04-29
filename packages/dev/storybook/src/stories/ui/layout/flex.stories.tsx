import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex as FlexComponent, type FlexProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { flexArgTypes } from '@lib/ui/props/flex';
import { swatches } from '../../../swatch';

const meta = {
  title: 'UI/Layout',
  component: FlexComponent,
  args: {
    as: 'div',
    direction: 'row',
    gap: 3,
    children: swatches(6),
  },
  argTypes: {
    ...boxArgTypes,
    ...flexArgTypes,
    // The `skeleton` prop is real, but a layout primitive with no
    // visual treatment of its own just turns into a featureless
    // pulsing block when you flip it on — there's nothing left to
    // demonstrate. The showcase at `UI/Patterns/Skeleton` exercises
    // skeleton wrapping a real layout instead.
    skeleton: { table: { disable: true } },
  },
} satisfies Meta<FlexProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flex: Story = {};
