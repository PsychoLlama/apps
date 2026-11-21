import { useAction, useValue } from '@lib/effects/solid';
import { Button, Callout, Flex, Text } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import { $openInvite } from '../effects';
import { $feed } from '../state';

/**
 * The item every group is founded with: what the group is for, and the
 * next thing to do in it. Set apart as a callout, so it reads as the
 * app talking and not as something a device shared.
 *
 * The item itself holds no words. It's a marker in the group's history,
 * synced and deletable like anything else, and what it says is decided
 * here, each time it's shown: it can change with the group, and with
 * the app, without anything stale left behind in a database.
 */
export const FeedWelcome = (props: {
  /** The group the item belongs to. */
  groupId: string;
}) => {
  const feed = useValue($feed);
  const openInvite = useAction($openInvite);

  /**
   * Whether this device is the only one in the group. The list always
   * has this device in it, so one is an answer and none is not yet.
   */
  const alone = () => feed().members.length === 1;

  return (
    <Callout
      testId="feed-welcome"
      color="neutral"
      variant="surface"
      icon={<IconLink aria-hidden="true" />}
    >
      <Flex as="div" direction="column" align="start" gap={3}>
        <Text as="p" selectable={false}>
          {alone()
            ? 'Link another device. Whatever you share here shows up on both.'
            : 'Whatever you share here shows up on every device in this group.'}
        </Text>

        <Button
          testId="feed-welcome-invite"
          variant="soft"
          color="neutral"
          size={1}
          disabled={openInvite.pending}
          onClick={() => openInvite(props.groupId)}
        >
          Link a device
        </Button>
      </Flex>
    </Callout>
  );
};
