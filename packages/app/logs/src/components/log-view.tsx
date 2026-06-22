import { createEffect, createMemo, onCleanup, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useParams } from '@solidjs/router';
import { useEffect } from '@lib/state';
import { Callout, Container, Flex, LinkButton, Text } from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import { formatSessionLabel } from '../format';
import { loadLogFileEffect } from '../log-file/bindings';
import { logFile } from '../log-file/store';
import { LogsView } from './logs-view';

/**
 * A single session's page at `/logs/:file`. The viewer itself is still to come
 * — for now it stands in with a work-in-progress callout under a breadcrumb
 * that names the session you landed on, followed by a button that downloads the
 * raw log file. The page resolves the file's OPFS handle on mount and parks it
 * in the file store; the download link is its first consumer.
 *
 * The route is never prerendered per file (names only exist at runtime); a
 * single shell is prerendered and `_redirects` rewrites every `/logs/:file`
 * onto it (see `app/main`'s `vite.config.ts` and `public/_redirects`). That
 * shell is served for any session, so the server can't know which file it is —
 * it renders a generic crumb, and the client fills in the real one on hydration.
 */
export const LogView = () => {
  const params = useParams<{ file: string }>();
  const fileName = createMemo(() => decodeURIComponent(params.file));
  const sessionLabel = createMemo(() =>
    isServer ? 'Session' : formatSessionLabel(fileName()),
  );

  const loadLogFile = useEffect(loadLogFileEffect);

  // Resolve the routed file on mount and on every name change. Each read gets
  // its own controller. On teardown — navigating to another session or leaving
  // the page — abort the in-flight read and revoke the URL it produced, in that
  // order: aborting happens before the next read's `onStart` clears the store,
  // so revocation always runs upstream of the URL being dropped, and blob URLs
  // never outlive the file they point at.
  createEffect(() => {
    const name = fileName();
    const controller = new AbortController();
    onCleanup(() => {
      controller.abort();
      if (logFile.downloadUrl) URL.revokeObjectURL(logFile.downloadUrl);
    });
    void loadLogFile({ name, signal: controller.signal });
  });

  return (
    <LogsView
      trail={[{ label: 'Logs', href: '/logs' }, { label: sessionLabel() }]}
    >
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={4}>
          <Callout color="neutral">
            <Text as="span" size={2} selectable={false}>
              Work in progress.
            </Text>
          </Callout>

          <Show when={logFile.downloadUrl}>
            {(url) => (
              <LinkButton
                testId="export-log"
                size={2}
                variant="solid"
                color="accent"
                href={url()}
                download={fileName()}
                aria-label={`Export ${sessionLabel()}`}
              >
                <IconDownload aria-hidden /> Export
              </LinkButton>
            )}
          </Show>
        </Flex>
      </Container>
    </LogsView>
  );
};
