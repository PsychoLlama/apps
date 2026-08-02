/**
 * This device, as read out of the same book its peers live in.
 *
 * A row about yourself sits in the contact store because it is the same kind
 * of thing — an endpoint with a name on it — and because the alternative was
 * a second table holding one string, read on its own schedule, that had to be
 * kept in step with a key it never referenced.
 */

import { defineFormula } from '@lib/state';
import { contactsStore } from './contacts';
import { generateLabel } from '../labels';
import { identityStore } from '../session/identity';

/**
 * What this device calls itself, and what it advertises to every peer it
 * links with: the name the reader chose, or the prefix of its own endpoint
 * key until they choose one.
 *
 * The fallback is a real name rather than a placeholder. It's derived from
 * the key, so it needs no exchange to agree on, and it's the same name an
 * unnamed contact goes by — which means a device that reaches a peer before
 * anyone has named it still arrives as somebody.
 *
 * Read off the live key rather than the row's own `endpointId`, which is
 * where the key was when the name was typed. The two are the same until a
 * key rotates, and after one the address peers actually dial is the live one.
 *
 * `null` until the key lands, which is a moment or two after mount rather
 * than a relay round trip away.
 */
export const selfLabelFormula = defineFormula(
  [identityStore, contactsStore],
  (self, book) => {
    if (!self.endpointId) return null;
    return book.self?.label ?? generateLabel(self.endpointId);
  },
);
