import { Callout, Flex, Link, Text } from '@lib/ui';

/**
 * What a group's pages show for a group this device doesn't hold: a link
 * to one it never had, one it left, or one it was removed from and has
 * forgotten.
 */
export const GroupMissing = () => (
  <Callout testId="group-missing" color="neutral">
    <Flex as="div" direction="column" gap={2}>
      <Text as="p" selectable={false}>
        This group isn't on this device. If it was removed from the group, what
        was shared to it has been deleted here.
      </Text>
      <Text as="p" selectable={false}>
        <Link testId="group-missing-home" href="/">
          Back to your groups
        </Link>
      </Text>
    </Flex>
  </Callout>
);
