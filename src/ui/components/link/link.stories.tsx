import { MemoryRouter } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { marginArgTypes } from '../../props/margin';
import { testIdArgTypes } from '../../props/test-id';
import { trimArgTypes } from '../../props/trim';
import LinkComponent, { type LinkProps } from './link';

const meta = {
  title: 'UI/Components',
  component: LinkComponent,
  decorators: [(Story) => <MemoryRouter root={() => Story()} />],
  args: {
    children: 'Click here',
    href: '/example',
    underline: 'auto',
    color: 'accent',
    highContrast: false,
    size: 3,
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    underline: {
      control: 'inline-radio',
      options: ['auto', 'always', 'hover', 'none'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral'],
    },
    highContrast: {
      control: 'boolean',
    },
    children: { control: 'text' },
    ...trimArgTypes,
    ...marginArgTypes,
    ...testIdArgTypes,
  },
} satisfies Meta<LinkProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Link: Story = {};
