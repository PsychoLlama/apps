import { Show } from 'solid-js';
import { Button, Card, Flex, Heading, LinkButton, Text } from '@lib/ui';
import SiteHeader from './site-header';
import IconAlert from 'virtual:icons/mdi/alert-circle-outline';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import IconHome from 'virtual:icons/mdi/home-outline';
import IconRefresh from 'virtual:icons/mdi/refresh';
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

/** Fallback rendered when the global `<ErrorBoundary>` catches an uncaught error. */
export default function ErrorBoundaryFallback(
  props: ErrorBoundaryFallbackProps,
) {
  const details = () => normalizeError(props.error);

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Error" />

      <Flex as="section" align="center" justify="center" grow p={5}>
        <Flex
          as="div"
          direction="column"
          align="center"
          gap={6}
          class={css.column}
        >
          <Flex as="div" align="center" justify="center" class={css.icon}>
            <IconAlert width="32" height="32" />
          </Flex>

          <Flex as="div" direction="column" gap={2} align="center">
            <Heading as="h1" size={7} weight="medium" align="center">
              Something went wrong
            </Heading>
            <Text as="p" size={3} color="lowContrast" align="center">
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
              as="button"
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
            >
              <IconChevron width="14" height="14" class={css.summaryChevron} />
              Show error details
            </Button>

            <Card as="div" size={2}>
              <Flex as="div" direction="column" gap={3}>
                <Flex as="div" direction="column" gap={1}>
                  <Heading
                    as="h2"
                    size={1}
                    weight="medium"
                    color="lowContrast"
                    selectable
                  >
                    {details().name}
                  </Heading>
                  <Text as="p" size={2} weight="medium" selectable>
                    {details().message}
                  </Text>
                </Flex>

                <Show when={details().stack}>
                  <Text
                    as="pre"
                    size={1}
                    color="lowContrast"
                    selectable
                    class={css.stack}
                  >
                    {details().stack}
                  </Text>
                </Show>
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
