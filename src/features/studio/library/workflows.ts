import { defineWorkflow } from '#state';
import { revokeBlobUrl } from './activities';

/** Removes a recording from the library and revokes its blob URL. */
export const deleteRecordingWorkflow = defineWorkflow(
  (ctx, input: { id: string; url: string }) => {
    ctx.run(revokeBlobUrl, input.url);
    return input.id;
  },
);

/** Renames a recording in the library. */
export const renameRecordingWorkflow = defineWorkflow(
  (_ctx, input: { id: string; name: string }) => input,
);
