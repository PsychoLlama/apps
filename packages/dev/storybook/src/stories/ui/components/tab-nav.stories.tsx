import { MemoryRouter, Route } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TabNavLink, TabNavRoot, type TabNavRootProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: TabNavRoot,
  args: {
    testId: 'tab-nav',
    'aria-label': 'Primary navigation',
    size: 2,
    color: 'accent',
    highContrast: false,
    justify: 'start',
    wrap: 'nowrap',
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    'aria-label': { control: 'text' },
    size: {
      control: { type: 'range', min: 1, max: 2, step: 1 },
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral'],
    },
    highContrast: { control: 'boolean' },
    justify: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    wrap: {
      control: 'inline-radio',
      options: ['nowrap', 'wrap', 'wrap-reverse'],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Route path="*" component={() => <Story />} />
      </MemoryRouter>
    ),
  ],
  render: (props: TabNavRootProps) => (
    <TabNavRoot {...props}>
      <TabNavLink testId={`${props.testId}-home`} href="/" active>
        Home
      </TabNavLink>
      <TabNavLink
        testId={`${props.testId}-projects`}
        href="/projects"
        active={false}
      >
        Projects
      </TabNavLink>
      <TabNavLink testId={`${props.testId}-team`} href="/team" active={false}>
        Team
      </TabNavLink>
      <TabNavLink
        testId={`${props.testId}-settings`}
        href="/settings"
        active={false}
      >
        Settings
      </TabNavLink>
    </TabNavRoot>
  ),
} satisfies Meta<TabNavRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TabNav: Story = {};

/**
 * Keyboard nav. Arrow keys move focus between links; Home/End jump to
 * the ends. No looping at the boundary, matching Radix's NavigationMenu.
 */
export const TabNavKeyboard: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const home = canvas.getByTestId('tab-nav-home');
    const projects = canvas.getByTestId('tab-nav-projects');
    const team = canvas.getByTestId('tab-nav-team');
    const settings = canvas.getByTestId('tab-nav-settings');

    home.focus();
    await expect(home).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(projects).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(team).toHaveFocus();

    await userEvent.keyboard('{End}');
    await expect(settings).toHaveFocus();

    // No loop: ArrowRight at the end stays put.
    await userEvent.keyboard('{ArrowRight}');
    await expect(settings).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(team).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await expect(projects).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect(home).toHaveFocus();

    // No loop: ArrowLeft at the start stays put.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(home).toHaveFocus();
  },
};
