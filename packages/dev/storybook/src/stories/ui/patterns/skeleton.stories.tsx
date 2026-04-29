import { MemoryRouter, Route } from '@solidjs/router';
import { createSignal } from 'solid-js';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import IconBell from 'virtual:icons/mdi/bell';
import IconHeart from 'virtual:icons/mdi/heart';
import IconMagnify from 'virtual:icons/mdi/magnify';
import {
  Badge,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  IconButton,
  Inset,
  Kbd,
  Link,
  Separator,
  Switch,
  TabNavLink,
  TabNavRoot,
  Text,
  TextArea,
  TextField,
} from '@lib/ui';
import * as css from './skeleton.stories.css';

interface SkeletonShowcaseArgs {
  /** Toggle every component in the layout into skeleton mode at once. */
  loading: boolean;
}

const meta = {
  title: 'UI/Patterns',
  args: {
    loading: true,
  },
  argTypes: {
    loading: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Route path="*" component={() => <Story />} />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<SkeletonShowcaseArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Cross-component skeleton showcase. Flip the `loading` arg to see
 * every supporting component swap to its pulsing placeholder at once
 * — buttons, badges, links, form controls, navigation, callouts, and
 * the surrounding card all share the same animation.
 */
export const Skeleton: Story = {
  render: (props: SkeletonShowcaseArgs) => {
    const [notifications, setNotifications] = createSignal(true);
    return (
      <Flex as="div" direction="column" gap={5} class={css.layout}>
        <Card as="div" size={3} skeleton={props.loading}>
          <Inset as="div" side="top" pad={false}>
            <Flex as="div" class={css.cover} />
          </Inset>
          <Heading as="h2" size={5} skeleton={props.loading}>
            Acme account dashboard
          </Heading>
          <Flex as="div" gap={2} my={2}>
            <Badge skeleton={props.loading}>Pro plan</Badge>
            <Badge color="success" skeleton={props.loading}>
              Live
            </Badge>
          </Flex>
          <Text as="p" size={2} skeleton={props.loading}>
            Manage your profile, see recent activity, and configure how the
            workspace notifies you.
          </Text>
          <Separator decorative my={3} skeleton={props.loading} />
          <Flex as="div" gap={3} align="center">
            <Button testId="primary" skeleton={props.loading}>
              Save changes
            </Button>
            <Button testId="secondary" variant="soft" skeleton={props.loading}>
              Cancel
            </Button>
            <IconButton
              testId="like"
              aria-label="Like"
              variant="ghost"
              color="neutral"
              skeleton={props.loading}
            >
              <IconHeart />
            </IconButton>
          </Flex>
        </Card>

        <Callout skeleton={props.loading}>
          Press <Kbd skeleton={props.loading}>?</Kbd> for a list of shortcuts,
          or{' '}
          <Link href="/help" testId="learn-more" skeleton={props.loading}>
            visit the docs
          </Link>
          .
        </Callout>

        <TabNavRoot
          testId="nav"
          aria-label="Account sections"
          skeleton={props.loading}
        >
          <TabNavLink testId="nav-overview" href="/" active>
            Overview
          </TabNavLink>
          <TabNavLink testId="nav-settings" href="/settings" active={false}>
            Settings
          </TabNavLink>
          <TabNavLink testId="nav-billing" href="/billing" active={false}>
            Billing
          </TabNavLink>
        </TabNavRoot>

        <Flex as="form" direction="column" gap={3}>
          <TextField
            testId="email"
            placeholder="you@example.com"
            left={<IconMagnify />}
            skeleton={props.loading}
          />
          <TextArea
            testId="message"
            placeholder="Tell us what's on your mind…"
            skeleton={props.loading}
          />
          <Flex as="div" align="center" gap={2}>
            <Switch
              testId="notifications"
              checked={notifications()}
              onCheckedChange={setNotifications}
              skeleton={props.loading}
            />
            <Text as="label" size={2} skeleton={props.loading}>
              <IconBell /> Email me when something changes
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  },
};
