import { MemoryRouter, Route } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { buttonStyleArgTypes } from '../../props/button';
import { marginArgTypes } from '../../props/margin';
import LinkButtonComponent, { type LinkButtonProps } from './link-button';

const meta = {
  title: 'UI/Components',
  component: LinkButtonComponent,
  args: {
    children: 'Link Button',
    href: '/',
    size: 2,
    variant: 'solid',
    color: 'accent',
  },
  argTypes: {
    ...marginArgTypes,
    ...buttonStyleArgTypes,
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

export const LinkButton: Story = {};
