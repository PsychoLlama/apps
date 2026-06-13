import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, For, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import {
  RadioCardsItem,
  RadioCardsRoot,
  type RadioCardsRootProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const OPTIONS = [1, 2] as const;

const meta = {
  title: 'UI/Components/RadioCards',
  component: RadioCardsRoot,
  args: {
    testId: 'radio-cards',
    name: 'radio-cards',
    value: '2',
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
  render: (args: RadioCardsRootProps) => {
    const [value, setValue] = createSignal<string | null>(
      untrack(() => args.value),
    );
    return (
      <RadioCardsRoot
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
            <RadioCardsItem
              testId={`${args.testId}-${option}`}
              value={String(option)}
            >
              Option {option}
            </RadioCardsItem>
          )}
        </For>
        <RadioCardsItem
          testId={`${args.testId}-disabled`}
          value="disabled"
          disabled
        >
          Option 4 (disabled)
        </RadioCardsItem>
      </RadioCardsRoot>
    );
  },
} satisfies Meta<RadioCardsRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
