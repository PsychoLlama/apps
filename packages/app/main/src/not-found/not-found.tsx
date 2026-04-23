import { Flex, Heading, Link, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconCompassOff from 'virtual:icons/mdi/compass-off-outline';
import * as css from './not-found.css';

/**
 * Catch-all page rendered when no route matches. Keeps the site
 * header for orientation, then centers a quiet message with a link
 * home.
 */
export default function NotFound() {
  return (
    <Flex as="main" direction="column" class={css.page}>
      <SiteHeader title="Lost" />

      <Flex as="section" align="center" justify="center" grow p={5}>
        <Flex
          as="div"
          direction="column"
          align="center"
          gap={5}
          class={css.column}
        >
          <Flex
            as="div"
            align="center"
            justify="center"
            class={css.iconHalo}
            aria-hidden="true"
          >
            <IconCompassOff />
          </Flex>

          <Flex as="div" direction="column" gap={3} align="center">
            <Heading as="h1" size={6} weight="medium" align="center">
              You're off the map
            </Heading>
            <Text as="p" size={3} color="lowContrast" align="center">
              The page you're looking for doesn't exist, or it packed up and
              moved somewhere quieter.
            </Text>
          </Flex>

          <Link
            testId="home-link"
            href="/"
            size={2}
            color="neutral"
            underline="hover"
          >
            Back to Apps
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}
