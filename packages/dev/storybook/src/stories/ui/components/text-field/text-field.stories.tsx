import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { splitProps } from 'solid-js';
import { fn } from 'storybook/test';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import {
  IconButton,
  TextField as TextFieldComponent,
  type TextFieldProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { requiredInputHintArgTypes } from '@lib/ui/props/input-hints';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

interface TextFieldArgs extends TextFieldProps {
  /** Toggle the left slot in Storybook controls. */
  hasLeft?: boolean;
  /** Toggle the right slot in Storybook controls. */
  hasRight?: boolean;
}

const meta = {
  title: 'UI/Components',
  component: TextFieldComponent,
  args: {
    testId: 'text-field',
    size: 2,
    variant: 'surface',
    radius: 'medium',
    type: 'text',
    placeholder: 'Search…',
    autocomplete: 'off',
    autocapitalize: 'off',
    enterkeyhint: 'search',
    hasLeft: true,
    hasRight: false,
    disabled: false,
    readOnly: false,
    onInput: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...requiredInputHintArgTypes,
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
      <TextFieldComponent
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

export const TextField: Story = {};
