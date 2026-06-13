import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { TextArea as TextAreaComponent, type TextAreaProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { requiredInputHintArgTypes } from '@lib/ui/props/input-hints';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: TextAreaComponent,
  args: {
    testId: 'text-area',
    size: 2,
    variant: 'surface',
    radius: 'medium',
    resize: 'vertical',
    placeholder: 'Tell us what you think…',
    autocomplete: 'off',
    autocapitalize: 'sentences',
    enterkeyhint: undefined,
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
    resize: {
      control: 'inline-radio',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<TextAreaProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextArea: Story = {};
