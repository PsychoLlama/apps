import { onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { createLogger } from '@lib/observability';
import { Container, Flex, Heading, Link, Text } from '@lib/ui';
import { Frame, FrameBody } from './frame';
import SiteHeader from './site-header';
import * as css from './not-found.css';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE).namespace(
  'not-found',
);

/**
 * Catch-all page rendered when no route matches. Keeps the site
 * header for orientation, then sits a quiet message in a capped
 * column with a link home.
 */
export default function NotFound() {
  const location = useLocation();

  // Report the miss once the fallback mounts. The full requested URL
  // is what lets us spot dead links and stale bookmarks in the logs.
  onMount(() => {
    logger.warn('No route matched.', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  });

  return (
    <Frame>
      <SiteHeader title="Lost" />

      <FrameBody as="section">
        <Container as="div" size={1} class={css.centered}>
          <Flex as="div" direction="column" align="center" gap={5}>
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
      </FrameBody>
    </Frame>
  );
}
