import { useAction } from '@lib/effects/solid';
import { Button, Flex, Text } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import { $openInvite } from '../effects';

/**
 * What a group shows while this device is the only one in it: the next
 * thing to do. Sharing to nobody works, and isn't why anyone is here.
 */
export const LinkPrompt = (props: {
  /** The group to link a device into. */
  groupId: string;
}) => {
  const openInvite = useAction($openInvite);

  return (
    <Flex
      as="section"
      direction="column"
      align="start"
      gap={3}
      testId="link-prompt"
    >
      <Text as="p" color="lowContrast" selectable={false}>
        Link another device. Whatever you share here shows up on both.
      </Text>

      <Button
        testId="link-prompt-invite"
        variant="soft"
        disabled={openInvite.pending}
        onClick={() => openInvite(props.groupId)}
      >
        <IconLink width="18" height="18" aria-hidden="true" />
        Link a device
      </Button>
    </Flex>
  );
};
