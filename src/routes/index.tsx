import { Flex, Heading, Text } from '#ui';
import * as css from './index.css';

export default function Home() {
  return (
    <Flex
      as="main"
      direction="column"
      align="center"
      justify="center"
      gap={3}
      class={css.page}
    >
      <Heading as="h1" size={8}>
        Apps
      </Heading>
      <Text as="p" size={4} color="lowContrast">
        Work in progress
      </Text>
    </Flex>
  );
}
