import { onMount, Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { createLogger, toError } from '@lib/observability';
import {
  Button,
  Card,
  Container,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  LinkButton,
  Text,
} from '@lib/ui';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import IconHome from 'virtual:icons/mdi/home-outline';
import IconRefresh from 'virtual:icons/mdi/refresh';
import { Frame, FrameBody } from './frame';
import SiteHeader from './site-header';
import * as css from './error-boundary.css';

/** Props for the global error boundary fallback. */
export interface ErrorBoundaryFallbackProps {
  /** The error caught by the boundary. */
  error: unknown;
  /** Clear the boundary and re-render children. */
  reset?: () => void;
}

interface NormalizedError {
  name: string;
  message: string;
  stack: string;
}

/** Coerce an unknown thrown value into a displayable shape. */
const normalizeError = (err: unknown): NormalizedError => {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message || 'Unknown error',
      stack: err.stack ?? '',
    };
  }

  return { name: 'Error', message: String(err), stack: '' };
};

const reloadPage = () => {
  if (typeof window !== 'undefined') window.location.reload();
};

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE).namespace(
  'error-boundary',
);

/** Shape of `navigator.userAgentData` — not yet in the TS DOM lib. */
interface UserAgentData {
  platform: string;
  mobile: boolean;
  brands: ReadonlyArray<{ brand: string; version: string }>;
}

/**
 * Best-effort UA client hints. Absent on Firefox/Safari (and any
 * non-secure context), so each field falls back to `undefined`.
 */
const readClientHints = () => {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;

  return {
    platform: data?.platform,
    mobile: data?.mobile,
    brands: data?.brands,
  };
};

/** Fallback rendered when the global `<ErrorBoundary>` catches an uncaught error. */
export default function ErrorBoundaryFallback(
  props: ErrorBoundaryFallbackProps,
) {
  const details = () => normalizeError(props.error);
  const location = useLocation();

  // Report the failure once the fallback mounts (client-only, so
  // `navigator` is safe). The route and client hints are what let us
  // correlate a production occurrence back to a page and environment.
  onMount(() => {
    logger.error('Uncaught render error.', {
      error: toError(props.error),
      route: location.pathname,
      ...readClientHints(),
    });
  });

  return (
    <Frame>
      <SiteHeader title="Error" />

      <FrameBody as="section">
        <Container as="div" size={2}>
          <Flex as="div" direction="column" align="center" gap={6}>
            <Flex as="div" direction="column" gap={2} align="center">
              <Heading
                as="h1"
                size={7}
                weight="medium"
                align="center"
                selectable={false}
              >
                Something went wrong
              </Heading>
              <Text
                as="p"
                size={3}
                color="lowContrast"
                align="center"
                selectable={false}
              >
                The page hit an unexpected error and couldn't render. Reload to
                try again, or head back to safer ground.
              </Text>
            </Flex>

            <Flex as="div" gap={3} wrap="wrap" justify="center">
              <LinkButton
                testId="recover-home"
                href="/"
                variant="soft"
                color="neutral"
                onClick={() => props.reset?.()}
              >
                <IconHome width="16" height="16" />
                Go home
              </LinkButton>
              <Button
                testId="recover-reload"
                variant="solid"
                color="accent"
                onClick={reloadPage}
              >
                <IconRefresh width="16" height="16" />
                Reload page
              </Button>
            </Flex>

            <Flex as="details" direction="column" gap={3} class={css.details}>
              <Button
                as="summary"
                testId="error-details-toggle"
                variant="ghost"
                color="neutral"
                class={css.summary}
              >
                <IconChevron
                  width="14"
                  height="14"
                  class={css.summaryChevron}
                />
                Show error details
              </Button>

              <Card as="div" size={2}>
                <DataListRoot orientation="vertical" size={2}>
                  <DataListItem>
                    <DataListLabel>Type</DataListLabel>
                    <DataListValue>{details().name}</DataListValue>
                  </DataListItem>
                  <DataListItem>
                    <DataListLabel>Message</DataListLabel>
                    <DataListValue>{details().message}</DataListValue>
                  </DataListItem>
                  <Show when={details().stack}>
                    <DataListItem>
                      <DataListLabel>Stack</DataListLabel>
                      <DataListValue>
                        <Text
                          as="pre"
                          size={1}
                          color="lowContrast"
                          selectable
                          class={css.stack}
                        >
                          {details().stack}
                        </Text>
                      </DataListValue>
                    </DataListItem>
                  </Show>
                </DataListRoot>
              </Card>
            </Flex>
          </Flex>
        </Container>
      </FrameBody>
    </Frame>
  );
}
