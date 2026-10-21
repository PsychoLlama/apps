import { Show, type JSX } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Button } from '@lib/ui';
import IconRefresh from 'virtual:icons/mdi/refresh';
import { $refreshArchive } from '../effects';
import { $archive } from '../state';

/**
 * A logs view: the breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are — and the content fills and
 * scrolls below it within the logs layout's `<main>` frame.
 */
export const LogsView = (props: {
  trail: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => {
  return (
    <>
      <SiteHeader trail={props.trail} actions={<RefreshButton />} />
      <FrameBody>{props.children}</FrameBody>
    </>
  );
};

/**
 * Refresh action pinned to the logs header tray. Surfaces once a read has
 * landed (the archive left its `initial` state) and lights up only when the
 * backend has reported new logs since — disabled while the view is current, so
 * it doubles as an up-to-date indicator. A press re-reads the archive through
 * the already-open connection.
 */
const RefreshButton = () => {
  const archive = useValue($archive);
  const refresh = useAction($refreshArchive);

  return (
    <Show when={archive().freshness !== 'initial'}>
      <Button
        testId="refresh-logs"
        variant="ghost"
        color="neutral"
        disabled={archive().freshness !== 'stale'}
        onClick={refresh}
      >
        <IconRefresh aria-hidden="true" />
        Refresh
      </Button>
    </Show>
  );
};
