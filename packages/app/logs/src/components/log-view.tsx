import { createMemo } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useParams } from '@solidjs/router';
import { Callout, Container, Text } from '@lib/ui';
import { formatSessionLabel } from '../format';
import { LogsView } from './logs-view';

/**
 * A single session's page at `/logs/:file`. The viewer itself is still to come
 * — for now it stands in with a work-in-progress callout under a breadcrumb
 * that names the session you landed on.
 *
 * The route is never prerendered per file (names only exist at runtime); a
 * single shell is prerendered and `_redirects` rewrites every `/logs/:file`
 * onto it (see `app/main`'s `vite.config.ts` and `public/_redirects`). That
 * shell is served for any session, so the server can't know which file it is —
 * it renders a generic crumb, and the client fills in the real one on hydration.
 */
export const LogView = () => {
  const params = useParams<{ file: string }>();
  const sessionLabel = createMemo(() =>
    isServer ? 'Session' : formatSessionLabel(decodeURIComponent(params.file)),
  );

  return (
    <LogsView
      trail={[{ label: 'Logs', href: '/logs' }, { label: sessionLabel() }]}
    >
      <Container as="div" size={2}>
        <Callout color="neutral">
          <Text as="span" size={2} selectable={false}>
            Work in progress.
          </Text>
        </Callout>
      </Container>
    </LogsView>
  );
};
