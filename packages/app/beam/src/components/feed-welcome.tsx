import { useAction } from '@lib/effects/solid';
import { Button, Flex, Text } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import { $openInvite } from '../effects';

/**
 * The item every group is founded with: what the group is for, and the
 * next thing to do in it. Quieter than what's shared around it, so it
 * reads as the app talking and not as something a device sent.
 *
 * The item itself holds no words. It's a marker in the group's history,
 * synced and deletable like anything else, and what it says is decided
 * here, each time it's shown: it can change with the app without
 * anything stale left behind in a database.
 *
 * It says the same thing on every device and however many are linked.
 * A group isn't one person's devices unless that's who's in it.
 */
export const FeedWelcome = (props: {
  /** The group the item belongs to. */
  groupId: string;
}) => {
  const openInvite = useAction($openInvite);

  return (
    <Flex
      as="section"
      direction="column"
      align="start"
      gap={3}
      py={2}
      testId="feed-welcome"
    >
      <Text as="p" color="lowContrast" selectable={false}>
        Everything shared here goes to every device in the group.
      </Text>

      <Button
        testId="feed-welcome-invite"
        variant="solid"
        size={2}
        disabled={openInvite.pending}
        onClick={() => openInvite(props.groupId)}
      >
        <IconLink width="18" height="18" aria-hidden="true" />
        Link a device
      </Button>
    </Flex>
  );
};
