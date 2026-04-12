import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { buttonStyleArgTypes } from '../../props/button';
import { marginArgTypes } from '../../props/margin';
import ButtonComponent, { type ButtonProps } from './button';

const meta = {
  title: 'UI/Components',
  component: ButtonComponent,
  args: {
    children: 'Button',
    size: 2,
    variant: 'solid',
    color: 'accent',
    onClick: fn(),
  },
  argTypes: {
    ...marginArgTypes,
    ...buttonStyleArgTypes,
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
