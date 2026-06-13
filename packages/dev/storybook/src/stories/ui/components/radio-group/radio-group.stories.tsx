import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import {
  RadioGroupItem,
  RadioGroupRoot,
  type RadioGroupRootProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: RadioGroupRoot,
  args: {
    testId: 'radio-group',
    name: 'radio-group',
    value: 'apple',
    onValueChange: fn(),
    size: 2,
    variant: 'surface',
    color: 'accent',
    disabled: false,
    required: false,
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'surface', 'soft'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    value: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
  },
  render: (args: RadioGroupRootProps) => {
    const [value, setValue] = createSignal<string | null>(
      untrack(() => args.value),
    );
    return (
      <RadioGroupRoot
        testId={args.testId}
        name={args.name}
        value={value()}
        onValueChange={(next) => {
          args.onValueChange(next);
          setValue(next);
        }}
        size={args.size}
        variant={args.variant}
        color={args.color}
        disabled={args.disabled}
        required={args.required}
        skeleton={args.skeleton}
      >
        <RadioGroupItem testId={`${args.testId}-apple`} value="apple">
          Apple
        </RadioGroupItem>
        <RadioGroupItem testId={`${args.testId}-banana`} value="banana">
          Banana
        </RadioGroupItem>
        <RadioGroupItem
          testId={`${args.testId}-cherry`}
          value="cherry"
          disabled
        >
          Cherry (disabled)
        </RadioGroupItem>
        <RadioGroupItem testId={`${args.testId}-durian`} value="durian">
          Durian
        </RadioGroupItem>
      </RadioGroupRoot>
    );
  },
} satisfies Meta<RadioGroupRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadioGroup: Story = {};
