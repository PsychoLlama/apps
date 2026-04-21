import { defineEffect } from '#state/next';
import { deleteRecording } from './actions';

/**
 * Revoke a recording's blob URL and remove it from the library on success.
 * Matches the old workflow ordering — revoke first, delete after — so a
 * revoke failure leaves the recording in the list for a retry.
 */
export const deleteRecordingEffect = defineEffect(
  (input: { id: string; url: string }): string => {
    URL.revokeObjectURL(input.url);
    return input.id;
  },
  { onSuccess: deleteRecording },
);
