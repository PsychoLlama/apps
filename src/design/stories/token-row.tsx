import type { ParentComponent } from 'solid-js';
import { Box, Flex, Heading, Text } from '#ui';

/** Label + description beside a visual swatch preview. */
const TokenRow: ParentComponent<{ name: string; description: string }> = (
  props,
) => (
  <Flex as="div" align="center" gap={4}>
    {props.children}

    <Box as="div">
      <Heading as="h3" size={2} weight="medium">
        {props.name}
      </Heading>

      <Text as="p" size={2} color="lowContrast">
        {props.description}
      </Text>
    </Box>
  </Flex>
);

export default TokenRow;
