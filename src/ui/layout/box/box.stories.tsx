import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import BoxComponent, { type BoxProps } from './box';

export const boxArgTypes = {
  as: {
    control: 'select' as const,
    options: [
      'div',
      'span',
      'nav',
      'main',
      'section',
      'aside',
      'header',
      'footer',
      'article',
      'figure',
      'figcaption',
      'details',
      'summary',
      'fieldset',
      'form',
      'ol',
      'ul',
      'li',
    ],
  },
  p: {
    control: { type: 'range' as const, min: 1, max: 9, step: 1 },
  },
  px: {
    control: { type: 'range' as const, min: 1, max: 9, step: 1 },
  },
  py: {
    control: { type: 'range' as const, min: 1, max: 9, step: 1 },
  },
  background: {
    control: 'inline-radio' as const,
    options: ['page', 'panelSolid', 'panelTranslucent', 'surface'],
  },
  radius: {
    control: 'select' as const,
    options: [1, 2, 3, 4, 5, 6, 'full'],
  },
  shadow: {
    control: { type: 'range' as const, min: 1, max: 6, step: 1 },
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
} satisfies Meta<BoxProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Box: Story = {};
