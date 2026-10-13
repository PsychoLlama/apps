import { defineFold, defineStore, defineTopic } from '@lib/state';
import { advancedSettingsScope } from './scope';

/** UI state for the Log storage controls. */
export interface LogStorageState {
  /** Whether the notice confirming a delete is showing. */
  deletedNoticeOpen: boolean;
}

export const logStorageStore = defineStore<LogStorageState>(
  advancedSettingsScope,
  () => ({ deletedNoticeOpen: false }),
);

/** Every persisted log was deleted. */
export const logsDeletedTopic = defineTopic();
defineFold(logsDeletedTopic, [logStorageStore], (storage) => {
  storage.deletedNoticeOpen = true;
});

/** The user dismissed the delete notice. */
export const logsDeletedNoticeClosedTopic = defineTopic();
defineFold(logsDeletedNoticeClosedTopic, [logStorageStore], (storage) => {
  storage.deletedNoticeOpen = false;
});
