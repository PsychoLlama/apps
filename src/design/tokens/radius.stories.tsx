import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { radius } from '#design';
import { Flex, Text } from '#ui';
import * as css from './radius.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radius: Story = {
  render: () => (
    <div class={css.radiusGrid}>
      <For each={Object.entries(radius)}>
        {([step, value]) => (
          <Flex as="div" direction="column" gap={2}>
            <div class={css.radiusBox} style={{ 'border-radius': value }} />
            <div>
              <Text as="div" size={1} color="lowContrast" align="center">
                radius.{step}
              </Text>
              <Text
                as="div"
                size={1}
                color="lowContrast"
                align="center"
                style={{ opacity: 0.6 }}
              >
                {value}
              </Text>
            </div>
          </Flex>
        )}
      </For>
    </div>
  ),
};
