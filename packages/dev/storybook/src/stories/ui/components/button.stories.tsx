import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button as ButtonComponent, type ButtonProps } from '@lib/ui';
import { buttonStyleArgTypes } from '@lib/ui/props/button';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: ButtonComponent,
  args: {
    children: 'Button',
    size: 2,
    variant: 'solid',
    color: 'accent',
    onClick: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...buttonStyleArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    disabled: {
      control: 'boolean',
    },
    children: { control: 'text' },
  },
} satisfies Meta<ButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  play: async ({
    args,
    canvasElement,
  }: {
    args: typeof meta.args;
    canvasElement: HTMLElement;
  }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
