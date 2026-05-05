import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { WebHaptics } from 'web-haptics';
import { align, edge, hint, tick, type HapticEffect } from '@lib/design';
import { Button, Callout, Flex, Text } from '@lib/ui';
import TokenRow from '../../token-row';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const effects: ReadonlyArray<{
  name: string;
  description: string;
  pattern: HapticEffect;
}> = [
  {
    name: 'hint',
    description:
      'Light cue on interactive surfaces. Silent on the web — see haptic.ts.',
    pattern: hint,
  },
  {
    name: 'tick',
    description: 'Discrete state change (list step, toggle).',
    pattern: tick,
  },
  {
    name: 'edge',
    description: 'Heavy boundary (scroll edge, range clamp).',
    pattern: edge,
  },
  {
    name: 'align',
    description: 'Crisp confirmation (snap, alignment).',
    pattern: align,
  },
];

export const Haptics: Story = {
  render: () => {
    const [haptics, setHaptics] = createSignal<WebHaptics | null>(null);

    onMount(() => {
      const instance = new WebHaptics();
      setHaptics(instance);
      onCleanup(() => instance.destroy());
    });

    return (
      <Flex as="div" direction="column" gap={5}>
        <Show when={!WebHaptics.isSupported}>
          <Callout color="warning">
            <Text as="p" trim="both">
              This device does not expose the Vibration API. Buttons will be
              silent — try on a mobile browser.
            </Text>
          </Callout>
        </Show>

        <For each={effects}>
          {(effect) => (
            <TokenRow name={effect.name} description={effect.description}>
              <Button
                testId={`haptic-${effect.name}`}
                onClick={() => {
                  void haptics()?.trigger([...effect.pattern]);
                }}
              >
                Tap
              </Button>
            </TokenRow>
          )}
        </For>
      </Flex>
    );
  },
};
