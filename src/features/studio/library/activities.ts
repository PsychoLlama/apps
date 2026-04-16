import { defineActivity } from '#state';

/** Releases the browser's reference to a blob URL. */
export const revokeBlobUrl = defineActivity({}, (url: string) => {
  URL.revokeObjectURL(url);
});
