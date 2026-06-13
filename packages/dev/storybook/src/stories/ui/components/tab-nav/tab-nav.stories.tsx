import { MemoryRouter, Route } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { TabNavLink, TabNavRoot, type TabNavRootProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
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
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
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
