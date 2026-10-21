import { Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { Button, Dialog, Flex, Heading, LinkButton, Text } from '@lib/ui';
import IconDelete from 'virtual:icons/mdi/delete-outline';
import IconDownload from 'virtual:icons/mdi/download-outline';
import { $deleteLogs } from '../effects/log-storage';
import { $serviceWorkerActive } from '../effects/service-worker';
import { $closeDeletedNotice, $deletedNoticeOpen } from '../state/log-storage';

const logStorageHeadingId = 'settings-log-storage-heading';

/** Export or delete the logs persisted on this device. */
export const LogStorage = () => {
  const deletedNoticeOpen = useValue($deletedNoticeOpen);
  const deleteLogs = useAction($deleteLogs);
  const closeNotice = useAction($closeDeletedNotice);
  const serviceWorkerActive = useValue($serviceWorkerActive);

  return (
    <Flex as="section" direction="column" gap={3}>
      <Flex as="header" direction="column" gap={2}>
        <Heading
          as="h3"
          id={logStorageHeadingId}
          size={4}
          weight="medium"
          selectable={false}
        >
          Log storage
        </Heading>
        <Text as="p" size={2} color="lowContrast" selectable={false}>
          Debug logs are saved locally. They are never uploaded or shared.
        </Text>
      </Flex>

      <Flex as="div" direction="row" gap={3} wrap="wrap">
        {/* The service worker serves the export, so there's nothing to
            link to until it's active. Anchors can't be disabled, so a
            disabled button stands in. */}
        <Show
          when={serviceWorkerActive()}
          fallback={
            <Button
              as="button"
              testId="advanced-log-export"
              variant="soft"
              color="neutral"
              disabled
            >
              <IconDownload aria-hidden="true" />
              Export
            </Button>
          }
        >
          {/* `target="_self"` rather than `download`: a `download` anchor
              skips the service worker that serves the export. */}
          <LinkButton
            testId="advanced-log-export"
            variant="soft"
            color="neutral"
            native
            href="/api/local/logs"
            target="_self"
          >
            <IconDownload aria-hidden="true" />
            Export
          </LinkButton>
        </Show>
        <Button
          as="button"
          testId="advanced-log-delete"
          variant="soft"
          color="neutral"
          onClick={deleteLogs}
        >
          <IconDelete aria-hidden="true" />
          Delete all
        </Button>
      </Flex>

      {/* No toasts yet, so a small dialog stands in for "it worked". */}
      <Dialog
        testId="advanced-log-deleted-notice"
        open={deletedNoticeOpen()}
        onOpenChange={closeNotice}
        title="Logs deleted"
        description="Every log stored on this device was removed."
        maxWidth="450px"
      >
        <Flex as="div" justify="end">
          <Button
            as="button"
            testId="advanced-log-deleted-notice-close"
            variant="soft"
            color="neutral"
            autofocus
            onClick={closeNotice}
          >
            Done
          </Button>
        </Flex>
      </Dialog>
    </Flex>
  );
};
