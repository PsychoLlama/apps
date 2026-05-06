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
import { gallery } from '../../../../gallery';

const VARIANTS = ['surface', 'classic'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
] as const;

/**
 * Each gallery cell echoes the demoed axis value in its card labels
 * when the value isn't already obvious from the visual treatment —
 * the variant cell prefixes "surface" / "classic" and the color cell
 * prefixes "accent" / "danger" / etc. Size + disabled cells skip the
 * prefix (the size renders visibly; the disabled cell uses the
 * disabled affordance).
 *
 * The first card is preselected so the checked indicator color
 * shows up directly.
 */
const Demo = (
  props: Partial<CheckboxCardsRootProps> & { id: string; label?: string },
) => {
  const [value, setValue] = createSignal<string[]>(['basic']);
  return (
    <CheckboxCardsRoot
      testId={`overview-${props.id}`}
      name={`overview-${props.id}`}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      variant={props.variant}
      color={props.color}
      disabled={props.disabled}
      columns={2}
    >
      <For each={OPTIONS}>
        {(option) => (
          <CheckboxCardsItem
            testId={`overview-${props.id}-${option.value}`}
            value={option.value}
          >
            {props.label ? `${props.label} ${option.label}` : option.label}
          </CheckboxCardsItem>
        )}
      </For>
    </CheckboxCardsRoot>
  );
};

const meta = {
  title: 'UI/Components/CheckboxCards',
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Demo id={`variant-${variant}`} label={variant} variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo id={`color-${color}`} label={color} color={color} />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo id={`size-${size}`} size={size} />),
    },
    {
      title: 'Disabled',
      items: [<Demo id="disabled" disabled />],
    },
  ],
});

export const Playground: Story = {};
