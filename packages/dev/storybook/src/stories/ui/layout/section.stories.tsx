import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Section as SectionComponent, type SectionProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { swatches } from '../../../swatch';

const meta = {
  title: 'UI/Layout',
  component: SectionComponent,
  args: {
    size: 3,
    children: swatches(1),
  },
  argTypes: {
    ...marginArgTypes,
    size: {
      control: 'inline-radio',
      options: [1, 2, 3, 4],
    },
    skeleton: { table: { disable: true } },
  },
} satisfies Meta<SectionProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Section: Story = {};
