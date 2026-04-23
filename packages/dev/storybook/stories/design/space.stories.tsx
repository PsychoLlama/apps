import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { space } from '@lib/design';
import { Flex } from '@lib/ui';
import TokenRow from './token-row';
import * as css from './space.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: Record<string, string> = {
  1: 'Tight gaps, inline spacing',
  2: 'Related element spacing',
  3: 'Compact component padding',
  4: 'Default component padding',
  5: 'Spacious component padding',
  6: 'Section gaps',
  7: 'Large section gaps',
  8: 'Layout-level spacing',
  9: 'Maximum spacing',
};

export const Spacing: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={Object.entries(space)}>
        {([step, value]) => (
          <TokenRow name={`space[${step}]`} description={labels[step]}>
            <Flex
              as="div"
              background="panelSolid"
              shadow={2}
              radius={1}
              class={css.spacingBar}
              style={{ width: value }}
            />
          </TokenRow>
        )}
      </For>
    </Flex>
  ),
};
