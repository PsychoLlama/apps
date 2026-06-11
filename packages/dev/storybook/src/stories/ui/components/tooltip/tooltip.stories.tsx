import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import IconContentCopy from 'virtual:icons/mdi/content-copy';
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Tooltip,
  type TooltipAlign,
  type TooltipProps,
  type TooltipSide,
} from '@lib/ui';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const SIDES: TooltipSide[] = ['top', 'right', 'bottom', 'left'];
const ALIGNS: TooltipAlign[] = ['start', 'center', 'end'];

const meta = {
  title: 'UI/Components/Tooltip',
  component: Tooltip,
  args: {
    content: 'Copy link',
    side: 'top',
    align: 'center',
    delayDuration: 700,
  },
  argTypes: {
    ...testIdArgTypes,
    content: { control: 'text' },
    side: { control: 'inline-radio', options: SIDES },
    align: { control: 'inline-radio', options: ALIGNS },
    delayDuration: { control: { type: 'range', min: 0, max: 2000, step: 100 } },
    open: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  render: (args: TooltipProps) => (
    <Tooltip {...args}>
      <Button as="button" variant="soft" testId="tooltip-trigger">
        Hover or focus me
      </Button>
    </Tooltip>
  ),
} satisfies Meta<TooltipProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Overview forces tooltips open to show placement statically. It must be a
// deferred `render` (not the `gallery()` helper, whose items evaluate at
// module load): Solid runs components eagerly, so an open tooltip built at
// import time would anchor against a detached node before it mounts.
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Flex as="section" direction="column" gap={9} p={9}>
      <Flex as="section" direction="column" gap={6}>
        <Heading as="h3" size={3} weight="medium" selectable={false}>
          Side
        </Heading>
        <Flex as="div" wrap="wrap" align="center" gap={9}>
          <For each={SIDES}>
            {(side) => (
              <Tooltip content={`side="${side}"`} side={side} open>
                <IconButton
                  aria-label="Copy"
                  variant="soft"
                  testId={`side-${side}`}
                >
                  <IconContentCopy />
                </IconButton>
              </Tooltip>
            )}
          </For>
        </Flex>
      </Flex>

      <Flex as="section" direction="column" gap={6}>
        <Heading as="h3" size={3} weight="medium" selectable={false}>
          Align (side="bottom")
        </Heading>
        <Flex as="div" wrap="wrap" align="center" gap={9}>
          <For each={ALIGNS}>
            {(align) => (
              <Tooltip
                content={`align="${align}"`}
                side="bottom"
                align={align}
                open
              >
                <Button as="button" variant="soft" testId={`align-${align}`}>
                  align {align}
                </Button>
              </Tooltip>
            )}
          </For>
        </Flex>
      </Flex>

      <Flex as="section" direction="column" gap={6}>
        <Heading as="h3" size={3} weight="medium" selectable={false}>
          Long content wraps
        </Heading>
        <Flex as="div" align="center">
          <Tooltip
            content="Tooltips cap their width and wrap long labels rather than stretching across the viewport."
            side="bottom"
            open
          >
            <Button as="button" variant="soft" testId="wrapping">
              Wrapping label
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Flex>
  ),
};

export const Playground: Story = {};
