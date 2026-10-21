import { defineCell, defineCommand } from '@lib/state/next';

/**
 * Whether the notice confirming a delete is showing, live while anything
 * holds it.
 */
export const $deletedNoticeOpen = defineCell(() => false);

/** Every persisted log was deleted. Shows the notice. */
export const $logsDeleted = defineCommand(
  [$deletedNoticeOpen],
  ([, setOpen]) =>
    () =>
      setOpen(true),
);

/** Dismiss the notice confirming a delete. */
export const $closeDeletedNotice = defineCommand(
  [$deletedNoticeOpen],
  ([, setOpen]) =>
    () =>
      setOpen(false),
);
