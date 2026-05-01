import { MemoryRouter } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { Link as LinkComponent, type LinkProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { trimArgTypes } from '@lib/ui/props/trim';
import { truncateArgTypes } from '@lib/ui/props/truncate';

const meta = {
  title: 'UI/Typography',
  component: LinkComponent,
  decorators: [(Story) => <MemoryRouter root={() => Story()} />],
  args: {
    children: 'Click here',
    href: '/example',
    underline: 'auto',
    color: 'accent',
    highContrast: false,
    size: 3,
    onClick: fn(),
    ...skeletonArgs,
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
    ...truncateArgTypes,
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
  },
} satisfies Meta<LinkProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Link: Story = {};
