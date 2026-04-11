import { Box, Flex, Heading, Text } from '#ui';
import SiteHeader from '../components/site-header';
import * as css from './index.css';

export default function Launcher() {
  return (
    <Flex as="main" direction="column" class={css.page}>
      <SiteHeader title="Apps" />
      <Flex as="section" align="center" justify="center" grow p={5}>
        <Flex as="div" direction="column" gap={5} class={css.column}>
          <Heading as="h1" size={2} weight="medium" color="lowContrast">
            Apps
          </Heading>

          <Flex as="nav" direction="column" gap={3}>
            <a href="/studio" class={css.link}>
              <Box as="div" class={css.indicator} />
              <Flex as="div" direction="column" gap={1}>
                <Text as="span" size={3} weight="medium">
                  Recording Studio
                </Text>
                <Text as="span" size={2} color="lowContrast">
                  Record your screen from the browser
                </Text>
              </Flex>
            </a>

            <a href="/favicon" class={css.link}>
              <Box as="div" class={css.indicator} />
              <Flex as="div" direction="column" gap={1}>
                <Text as="span" size={3} weight="medium">
                  Favicon Generator
                </Text>
                <Text as="span" size={2} color="lowContrast">
                  Create favicons from free icon sets
                </Text>
              </Flex>
            </a>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
