import type { ParentComponent } from 'solid-js';
import { Flex, Heading, Text } from '@psychollama/ui';

/** Label + description beside a visual swatch preview. */
const TokenRow: ParentComponent<{ name: string; description: string }> = (
  props,
) => (
  <Flex as="div" align="center" gap={4}>
    {props.children}

    <Flex as="div" direction="column">
      <Heading as="h3" size={2} weight="medium" selectable={false}>
        {props.name}
      </Heading>

      <Text as="p" size={2} color="lowContrast" selectable={false}>
        {props.description}
      </Text>
    </Flex>
  </Flex>
);

export default TokenRow;
