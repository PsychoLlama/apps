import { Container, Flex, Heading, Link, Section, Text } from '@lib/ui';
import IconCompassOff from 'virtual:icons/mdi/compass-off-outline';
import SiteHeader from './site-header';
import * as css from './not-found.css';

/**
 * Catch-all page rendered when no route matches. Keeps the site
 * header for orientation, then sits a quiet message in a capped
 * column with a link home.
 */
export default function NotFound() {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Lost" />

      <Section size={4}>
        <Container as="div" size={1} px={4}>
          <Flex as="div" direction="column" align="center" gap={5}>
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
              <Heading
                as="h1"
                size={6}
                weight="medium"
                align="center"
                selectable={false}
              >
                You're off the map
              </Heading>
              <Text
                as="p"
                size={3}
                color="lowContrast"
                align="center"
                selectable={false}
              >
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
        </Container>
      </Section>
    </Flex>
  );
}
