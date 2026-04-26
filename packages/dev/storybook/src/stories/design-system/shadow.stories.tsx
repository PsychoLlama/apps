import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { shadow } from '@lib/design';
import { Flex } from '@lib/ui';
import TokenRow from '../../token-row';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: Record<string, string> = {
  1: 'Inset (inputs, switches)',
  2: 'Slight (floating indicators)',
  3: 'Medium (raised surfaces)',
  4: 'High (hover cards, tooltips)',
  5: 'Higher (dropdowns, popovers)',
  6: 'Maximum (modals, dialogs)',
};

export const Shadows: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={Object.entries(shadow)}>
        {([step, value]) => (
          <TokenRow name={`shadow[${step}]`} description={labels[step]}>
            <Flex
              as="div"
              p={5}
              background="panelSolid"
              radius={4}
              style={{ 'box-shadow': value }}
            />
          </TokenRow>
        )}
      </For>
    </Flex>
  ),
};
