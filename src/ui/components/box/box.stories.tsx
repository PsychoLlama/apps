import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { paddingArgTypes } from '../../props/padding';
import { marginArgTypes } from '../../props/margin';
import BoxComponent, { type BoxProps } from './box';

export const boxArgTypes = {
  as: {
    control: 'text' as const,
  },
  ...paddingArgTypes,
  ...marginArgTypes,
  background: {
    control: 'inline-radio' as const,
    options: ['page', 'panelSolid', 'panelTranslucent', 'surface'],
  },
  radius: {
    control: 'select' as const,
    options: [1, 2, 3, 4, 5, 6, 'full'],
  },
  shadow: {
    control: 'select' as const,
    options: [1, 2, 3, 4, 5, 6],
  },
};

const meta = {
  title: 'UI/Layout',
  component: BoxComponent,
  excludeStories: ['boxArgTypes'],
  args: {
    children: 'Box content',
    as: 'div',
    p: 4,
    background: 'surface',
    radius: 4,
  },
  argTypes: {
    ...boxArgTypes,
    children: { control: 'text' },
  },
} satisfies Meta<BoxProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Box: Story = {};
