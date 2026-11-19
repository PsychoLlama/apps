import { defineCell, defineCommand } from '@lib/state';

/** The device someone has asked to remove and not yet confirmed, by id. */
export const $removal = defineCell<string | null>(() => null);

/** A device's removal was asked about, or the question was put away. */
export const $removalAsked = defineCommand(
  [$removal],
  ([, setRemoval]) =>
    (deviceId: string | null) => {
      setRemoval(deviceId);
    },
);
