import { collect } from '@lib/effects';
import { removeContact, saveContact } from '../platform/database';
import { $deviceNamed, $identity } from '../state';

/**
 * Name this device, answering whether it took. An emptied name clears it,
 * dropping the device back to the prefix of its own key.
 *
 * Needs the key, so it refuses before one lands. In practice one always has:
 * the key is minted on load and this is driven by a button.
 *
 * A row left at an address this device no longer answers on is deleted. The
 * name follows the device, so a rotated key would otherwise leave a second
 * self row on disk.
 *
 * This is the half that has to survive a reload. Telling the peers already
 * on the line is `$renameDevice`'s job.
 */
export const $nameDevice = collect(
  [$identity, $deviceNamed],
  (self, deviceNamed) =>
    async (label: string | null): Promise<boolean> => {
      const { endpointId } = self;
      if (!endpointId) return false;

      const previous = self.record?.endpointId;
      deviceNamed(endpointId, label, Date.now());

      if (previous && previous !== endpointId) await removeContact(previous);

      // Read back rather than rebuilt: the command decides what a name may
      // be, so what goes to disk has to be what it settled on.
      const named = self.record;
      if (named) await saveContact({ ...named });

      return true;
    },
);
