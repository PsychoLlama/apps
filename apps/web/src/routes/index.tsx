import { Flex, Heading, Link, Text } from '@lib/ui';
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
            <Link
              testId="studio-link"
              href="/studio"
              underline="none"
              class={css.link}
            >
              <Flex as="div" class={css.indicator} />
              <Flex as="div" direction="column" gap={1}>
                <Text as="span" size={3} weight="medium">
                  Recording Studio
                </Text>
                <Text as="span" size={2} color="lowContrast">
                  Record your screen from the browser
                </Text>
              </Flex>
            </Link>

            <Flex as="div" class={`${css.link} ${css.linkDisabled}`}>
              <Flex as="div" class={css.indicatorDisabled} />
              <Flex as="div" direction="column" gap={1} grow>
                <Text as="span" size={3} weight="medium" color="lowContrast">
                  Favicon Generator
                </Text>
                <Text as="span" size={2} color="lowContrast">
                  Create favicons from free icon sets
                </Text>
              </Flex>
              <Text as="span" size={1} color="lowContrast">
                Coming soon
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
