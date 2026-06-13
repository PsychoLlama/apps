import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, For, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import {
  CheckboxCardsItem,
  CheckboxCardsRoot,
  type CheckboxCardsRootProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
] as const;

const meta = {
  title: 'UI/Components',
  component: CheckboxCardsRoot,
  args: {
    testId: 'checkbox-cards',
    name: 'checkbox-cards',
    value: ['basic'],
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
      options: ['surface', 'classic'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    columns: {
      control: 'select',
      options: [undefined, 1, 2, 3, 4, 5, 6],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    value: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
  },
  render: (args: CheckboxCardsRootProps) => {
    const [value, setValue] = createSignal<string[]>(
      untrack(() => [...args.value]),
    );
    return (
      <CheckboxCardsRoot
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
        columns={args.columns}
        disabled={args.disabled}
        required={args.required}
        skeleton={args.skeleton}
      >
        <For each={OPTIONS}>
          {(option) => (
            <CheckboxCardsItem
              testId={`${args.testId}-${option.value}`}
              value={option.value}
            >
              {option.label}
            </CheckboxCardsItem>
          )}
        </For>
        <CheckboxCardsItem
          testId={`${args.testId}-enterprise`}
          value="enterprise"
          disabled
        >
          Enterprise (disabled)
        </CheckboxCardsItem>
      </CheckboxCardsRoot>
    );
  },
} satisfies Meta<CheckboxCardsRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxCards: Story = {};
