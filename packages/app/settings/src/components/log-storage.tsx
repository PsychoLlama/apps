import { useResource } from '@lib/effects/solid';
import { useAnchor, useCommit, useRun } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import { Button, Dialog, Flex, Heading, LinkButton, Text } from '@lib/ui';
import IconDelete from 'virtual:icons/mdi/delete-outline';
import IconDownload from 'virtual:icons/mdi/download-outline';
import {
  advancedSettingsScope,
  deleteLogsSaga,
  $logStorage,
  logsDeletedNoticeClosedTopic,
} from '../state/advanced';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

const logStorageHeadingId = 'settings-log-storage-heading';

/** Export or delete the logs persisted on this device. */
export const LogStorage = () => {
  useAnchor(advancedSettingsScope);
  const logStorage = useResource($logStorage);
  const deleteLogs = useRun(deleteLogsSaga);
  const commit = useCommit();
  const closeNotice = () => commit(logsDeletedNoticeClosedTopic());

  const onDelete = () => {
    void deleteLogs().catch((error: unknown) => {
      logger.error('Failed to delete logs.', { error: toError(error) });
    });
  };

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
        <Button
          as="button"
          testId="advanced-log-delete"
          variant="soft"
          color="neutral"
          onClick={onDelete}
        >
          <IconDelete aria-hidden="true" />
          Delete all
        </Button>
      </Flex>

      {/* No toasts yet, so a small dialog stands in for "it worked". */}
      <Dialog
        testId="advanced-log-deleted-notice"
        open={logStorage()?.deletedNoticeOpen ?? false}
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
