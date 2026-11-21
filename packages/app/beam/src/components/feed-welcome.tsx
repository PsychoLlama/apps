import { useAction } from '@lib/effects/solid';
import { Button, Flex, Text } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import { $deleteItem, $openInvite } from '../effects';

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
 * It says the same thing on every device and however many are
 * connected. A group isn't one person's devices unless that's who's in it.
 *
 * Dismissing it deletes the item, as deleting it from its row does: it
 * goes from every device in the group.
 */
export const FeedWelcome = (props: {
  /** The group the item belongs to. */
  groupId: string;

  /** The item itself, to delete when it's dismissed. */
  itemId: string;
}) => {
  const openInvite = useAction($openInvite);
  const deleteItem = useAction($deleteItem);

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
        Share messages and attachments between devices. Encrypted, peer-to-peer,
        never stored in the cloud.
      </Text>

      <Flex as="div" align="center" gap={3} wrap="wrap">
        <Button
          testId="feed-welcome-invite"
          variant="solid"
          size={2}
          disabled={openInvite.pending}
          onClick={() => openInvite(props.groupId)}
        >
          <IconLink width="18" height="18" aria-hidden="true" />
          Connect a device
        </Button>

        <Button
          testId="feed-welcome-dismiss"
          variant="soft"
          color="neutral"
          size={2}
          disabled={deleteItem.pending}
          onClick={() => deleteItem(props.groupId, props.itemId)}
        >
          Dismiss
        </Button>
      </Flex>
    </Flex>
  );
};
