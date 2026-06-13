import { MemoryRouter, Route } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { LinkButton, type LinkButtonProps } from '@lib/ui';
import { buttonStyleArgTypes } from '@lib/ui/props/button';
import { marginArgTypes } from '@lib/ui/props/margin';
import { nativeArgTypes } from '@lib/ui/props/native';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components/LinkButton',
  component: LinkButton,
  args: {
    children: 'Link Button',
    href: '/',
    size: 2,
    variant: 'solid',
    color: 'accent',
    onClick: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...buttonStyleArgTypes,
    ...nativeArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
    href: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Route path="*" component={() => <Story />} />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<LinkButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
