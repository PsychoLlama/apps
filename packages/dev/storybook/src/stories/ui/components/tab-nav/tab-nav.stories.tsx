import { MemoryRouter, Route } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { TabNavLink, TabNavRoot, type TabNavRootProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const SIZES = [1, 2] as const;
const COLORS = ['accent', 'neutral'] as const;

const Demo = (props: Partial<TabNavRootProps> & { id: string }) => (
  <MemoryRouter>
    <Route
      path="*"
      component={() => (
        <TabNavRoot
          aria-label="Demo navigation"
          testId={`overview-${props.id}`}
          {...props}
        >
          <TabNavLink testId={`overview-${props.id}-home`} href="/" active>
            Home
          </TabNavLink>
          <TabNavLink
            testId={`overview-${props.id}-projects`}
            href="/projects"
            active={false}
          >
            Projects
          </TabNavLink>
          <TabNavLink
            testId={`overview-${props.id}-team`}
            href="/team"
            active={false}
          >
            Team
          </TabNavLink>
        </TabNavRoot>
      )}
    />
  </MemoryRouter>
);

const meta = {
  title: 'UI/Components/TabNav',
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo id={`size-${size}`} size={size} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo id={`color-${color}`} color={color} />
      )),
    },
    {
      title: 'High contrast',
      items: COLORS.map((color) => (
        <Demo id={`hc-${color}`} color={color} highContrast />
      )),
    },
  ],
});

export const Playground: Story = {};
