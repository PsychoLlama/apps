import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  Flex,
  Progress as ProgressComponent,
  type ProgressProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import * as css from './progress.stories.css';

const meta = {
  title: 'UI/Components',
  component: ProgressComponent,
  args: {
    testId: 'progress',
    value: 60,
    max: 100,
    size: 2,
    variant: 'surface',
    radius: 'full',
    color: 'accent',
    duration: '5s',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'number', min: 1 } },
    size: { control: { type: 'range', min: 1, max: 3, step: 1 } },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'surface', 'soft'],
    },
    radius: {
      control: 'inline-radio',
      options: ['none', 'small', 'medium', 'large', 'full'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    duration: { control: 'text' },
  },
  // Constrain default Playground width so the bar has somewhere to grow
  // — the component itself is `flex-grow: 1` and would collapse to zero
  // otherwise when rendered as a story root.
  decorators: [
    (Story) => (
      <Flex as="div" class={css.playgroundFrame}>
        <Story />
      </Flex>
    ),
  ],
} satisfies Meta<ProgressProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Progress: Story = {};
