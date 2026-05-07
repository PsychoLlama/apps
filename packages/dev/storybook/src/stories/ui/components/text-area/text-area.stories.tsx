import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { TextArea, type TextAreaProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { requiredMobileInputArgTypes } from '@lib/ui/props/mobile-input';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;
const RESIZES = ['none', 'vertical', 'horizontal', 'both'] as const;

const defaults = {
  testId: 'overview',
  autocomplete: 'off',
  autocapitalize: 'sentences',
  enterkeyhint: undefined,
} as const;

const meta = {
  title: 'UI/Components/TextArea',
  component: TextArea,
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
    ...requiredMobileInputArgTypes,
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <TextArea {...defaults} variant={variant} placeholder={variant} />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <TextArea {...defaults} size={size} placeholder={`Size ${size}`} />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <TextArea {...defaults} radius={radius} placeholder={radius} />
      )),
    },
    {
      title: 'Resize',
      items: RESIZES.map((resize) => (
        <TextArea {...defaults} resize={resize} placeholder={resize} />
      )),
    },
    {
      title: 'State',
      items: [
        <TextArea {...defaults} placeholder="Default" />,
        <TextArea {...defaults} placeholder="Disabled" disabled />,
        <TextArea {...defaults} placeholder="Read-only" readOnly />,
      ],
    },
  ],
});

export const Playground: Story = {};
