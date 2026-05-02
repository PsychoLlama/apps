import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { splitProps } from 'solid-js';
import { fn } from 'storybook/test';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import { IconButton, TextField, type TextFieldProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = {
  testId: 'overview',
  placeholder: 'Search…',
} as const;

interface TextFieldArgs extends TextFieldProps {
  /** Toggle the left slot in Storybook controls. */
  hasLeft?: boolean;
  /** Toggle the right slot in Storybook controls. */
  hasRight?: boolean;
}

const meta = {
  title: 'UI/Components/TextField',
  component: TextField,
  args: {
    testId: 'text-field',
    size: 2,
    variant: 'surface',
    radius: 'medium',
    type: 'text',
    placeholder: 'Search…',
    hasLeft: true,
    hasRight: false,
    disabled: false,
    readOnly: false,
    onInput: fn(),
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
    radius: {
      control: 'inline-radio',
      options: ['none', 'small', 'medium', 'large', 'full'],
    },
    type: {
      control: 'select',
      options: [
        'text',
        'password',
        'email',
        'number',
        'tel',
        'url',
        'search',
        'date',
        'datetime-local',
        'month',
        'time',
        'week',
      ],
    },
    hasLeft: { control: 'boolean' },
    hasRight: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  render: (props: TextFieldArgs) => {
    const [storyOnly, textFieldProps] = splitProps(props, [
      'hasLeft',
      'hasRight',
    ]);
    return (
      <TextField
        {...textFieldProps}
        left={storyOnly.hasLeft ? <IconMagnify /> : undefined}
        right={
          storyOnly.hasRight ? (
            <IconButton
              testId={`${textFieldProps.testId}-clear`}
              aria-label="Clear"
              size={1}
              variant="ghost"
              color="neutral"
            >
              <IconClose />
            </IconButton>
          ) : undefined
        }
      />
    );
  },
} satisfies Meta<TextFieldArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <TextField {...defaults} variant={variant} left={<IconMagnify />} />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <TextField {...defaults} size={size} left={<IconMagnify />} />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <TextField {...defaults} radius={radius} left={<IconMagnify />} />
      )),
    },
    {
      title: 'Slots',
      items: [
        <TextField {...defaults} placeholder="No slots" />,
        <TextField {...defaults} placeholder="Left" left={<IconMagnify />} />,
        <TextField
          {...defaults}
          placeholder="Right"
          right={
            <IconButton
              testId="overview-clear"
              aria-label="Clear"
              size={1}
              variant="ghost"
              color="neutral"
            >
              <IconClose />
            </IconButton>
          }
        />,
        <TextField
          {...defaults}
          placeholder="Both"
          left={<IconMagnify />}
          right={
            <IconButton
              testId="overview-clear"
              aria-label="Clear"
              size={1}
              variant="ghost"
              color="neutral"
            >
              <IconClose />
            </IconButton>
          }
        />,
      ],
    },
    {
      title: 'State',
      items: [
        <TextField
          {...defaults}
          placeholder="Default"
          left={<IconMagnify />}
        />,
        <TextField
          {...defaults}
          placeholder="Disabled"
          left={<IconMagnify />}
          disabled
        />,
        <TextField
          {...defaults}
          placeholder="Read-only"
          left={<IconMagnify />}
          readOnly
        />,
      ],
    },
  ],
});

export const Playground: Story = {};
