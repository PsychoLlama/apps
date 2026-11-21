import { Flex, Text } from '@lib/ui';

/**
 * What a group's feed shows when nothing is in it: that it's empty, and
 * what to do about it. Centered, where an empty room's one sign goes.
 */
export const FeedEmpty = () => (
  <Flex
    as="section"
    direction="column"
    align="center"
    gap={2}
    testId="feed-empty"
  >
    <Text as="span" size={8} selectable={false} aria-hidden="true">
      📭
    </Text>

    <Text as="p" weight="medium" align="center" selectable={false}>
      Nothing shared yet
    </Text>

    <Text as="p" size={2} color="lowContrast" align="center" selectable={false}>
      Type, paste, or drop something below.
    </Text>
  </Flex>
);
