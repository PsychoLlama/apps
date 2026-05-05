import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, For, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import {
  Heading,
  RadioCardsItem,
  RadioCardsRoot,
  type RadioCardsRootProps,
  Text,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['surface', 'classic'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

const PLANS = [
  { value: 'basic', title: 'Basic', detail: '$0/mo' },
  { value: 'pro', title: 'Pro', detail: '$12/mo' },
  { value: 'team', title: 'Team', detail: '$36/mo' },
] as const;

const Body = (props: { title: string; detail: string }) => (
  <>
    <Heading as="h3" size={2}>
      {props.title}
    </Heading>
    <Text as="p" size={1} color="lowContrast">
      {props.detail}
    </Text>
  </>
);

const Demo = (props: Partial<RadioCardsRootProps> & { id: string }) => {
  const [value, setValue] = createSignal<string | null>('pro');
  return (
    <RadioCardsRoot
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
      <For each={PLANS}>
        {(plan) => (
          <RadioCardsItem
            testId={`overview-${props.id}-${plan.value}`}
            value={plan.value}
          >
            <Body title={plan.title} detail={plan.detail} />
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );
};

const meta = {
  title: 'UI/Components/RadioCards',
  component: RadioCardsRoot,
  args: {
    testId: 'radio-cards',
    name: 'radio-cards',
    value: 'pro',
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
        <For each={PLANS}>
          {(plan) => (
            <RadioCardsItem
              testId={`${args.testId}-${plan.value}`}
              value={plan.value}
            >
              <Body title={plan.title} detail={plan.detail} />
            </RadioCardsItem>
          )}
        </For>
        <RadioCardsItem
          testId={`${args.testId}-disabled`}
          value="disabled"
          disabled
        >
          <Body title="Enterprise" detail="Contact us" />
        </RadioCardsItem>
      </RadioCardsRoot>
    );
  },
} satisfies Meta<RadioCardsRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Demo id={`variant-${variant}`} variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo id={`color-${color}`} color={color} />
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
