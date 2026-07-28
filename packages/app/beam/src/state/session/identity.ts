import { defineFormula } from '@lib/state';
import { generateLabel } from '../labels';
import { relayCell } from './connection';

/**
 * What this device calls itself: the name generated from its own endpoint
 * key. Read-only and unconfigurable for now — the point is that both sides of
 * a pairing can name each other before either has typed anything, and a name
 * derived from the key needs no exchange to agree on.
 *
 * `null` until the relay connection lands, since there's no endpoint to
 * derive it from before that — including during SSG and first paint.
 */
export const selfLabelFormula = defineFormula([relayCell], (endpoint) =>
  endpoint ? generateLabel(endpoint.endpointId) : null,
);
