import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import { Button, TextField, type TextFieldProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

interface TextFieldArgs extends TextFieldProps {
  /** Toggle the left slot in Storybook controls. */
  hasLeft?: boolean;
  /** Toggle the right slot in Storybook controls. */
  hasRight?: boolean;
}

const meta = {
  title: 'UI/Components',
  component: TextField,
  args: {
    testId: 'text-field',
    size: 2,
    variant: 'surface',
    radius: 'medium',
    placeholder: 'Search…',
    hasLeft: true,
    hasRight: false,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    ...marginArgTypes,
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
    hasLeft: { control: 'boolean' },
    hasRight: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  render: (props: TextFieldArgs) => (
    <TextField
      testId={props.testId}
      size={props.size}
      variant={props.variant}
      radius={props.radius}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      left={props.hasLeft ? <IconMagnify /> : undefined}
      right={
        props.hasRight ? (
          <Button
            testId={`${props.testId}-clear`}
            size={1}
            variant="ghost"
            color="neutral"
          >
            <IconClose />
          </Button>
        ) : undefined
      }
    />
  ),
} satisfies Meta<TextFieldArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * TextField. Slot content is toggled via the `hasLeft` / `hasRight`
 * boolean controls in the Storybook panel; the underlying API takes
 * arbitrary `JSX.Element` for both sides.
 */
export const TextField_: Story = { name: 'TextField' };
