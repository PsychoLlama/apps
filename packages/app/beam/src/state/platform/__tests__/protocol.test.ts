/**
 * Unit tests for the beam wire protocol. The decoder is a trust boundary —
 * everything it reads arrives from an unauthenticated stranger — so most of
 * what's asserted here is about what it refuses.
 */

import {
  decodeMessage,
  encodeMessage,
  helloMessage,
  shareMessage,
} from '../protocol';
import { LABEL_MAX_LENGTH } from '../../labels';
import { SHARE_MAX_LENGTH } from '../../share-body';

/** Bytes as a peer would put them on the wire, without going through us. */
const wire = (raw: string): Uint8Array => new TextEncoder().encode(raw);

describe('encodeMessage / decodeMessage', () => {
  it('round-trips a greeting', () => {
    expect(decodeMessage(encodeMessage(helloMessage('Work phone')))).toEqual(
      helloMessage('Work phone'),
    );
  });

  it('round-trips a share, newlines and all', () => {
    const message = shareMessage('line one\nline two');

    expect(decodeMessage(encodeMessage(message))).toEqual(message);
  });
});

describe('decodeMessage', () => {
  it('refuses bytes that are not JSON', () => {
    expect(decodeMessage(wire('not json at all'))).toBeNull();
  });

  it('refuses JSON that is not an object', () => {
    expect(decodeMessage(wire('"hello"'))).toBeNull();
    expect(decodeMessage(wire('42'))).toBeNull();
    expect(decodeMessage(wire('null'))).toBeNull();
    expect(decodeMessage(wire('[]'))).toBeNull();
  });

  it('refuses a type it has never heard of', () => {
    // Room to add messages later without older builds acting on them.
    expect(decodeMessage(wire('{"type":"transfer"}'))).toBeNull();
  });

  it('refuses a greeting whose name is not a string', () => {
    expect(decodeMessage(wire('{"type":"hello","label":{}}'))).toBeNull();
    expect(decodeMessage(wire('{"type":"hello"}'))).toBeNull();
  });

  it('refuses a greeting carrying an absurd name', () => {
    const overlong = 'a'.repeat(LABEL_MAX_LENGTH + 1);
    const message = JSON.stringify({ type: 'hello', label: overlong });

    // Truncating this would make a deliberate-looking name out of an
    // obviously hostile one. It's cheaper to disbelieve the whole frame.
    expect(decodeMessage(wire(message))).toBeNull();
  });

  it('takes a name right at the limit', () => {
    const label = 'a'.repeat(LABEL_MAX_LENGTH);
    const message = JSON.stringify({ type: 'hello', label });

    expect(decodeMessage(wire(message))).toEqual(helloMessage(label));
  });

  it('refuses a share whose body is not a string', () => {
    expect(decodeMessage(wire('{"type":"share","body":42}'))).toBeNull();
    expect(decodeMessage(wire('{"type":"share"}'))).toBeNull();
  });

  it('refuses a share the transport could not have carried', () => {
    const overlong = 'a'.repeat(SHARE_MAX_LENGTH + 1);
    const message = JSON.stringify({ type: 'share', body: overlong });

    expect(decodeMessage(wire(message))).toBeNull();
  });

  it('takes a share right at the limit', () => {
    const body = 'a'.repeat(SHARE_MAX_LENGTH);
    const message = JSON.stringify({ type: 'share', body });

    expect(decodeMessage(wire(message))).toEqual(shareMessage(body));
  });

  it('drops fields it did not ask for', () => {
    const message = JSON.stringify({
      type: 'hello',
      label: 'Laptop',
      endpointId: 'ep-someone-else',
    });

    // A peer doesn't get to smuggle state in beside the message it sent.
    expect(decodeMessage(wire(message))).toEqual(helloMessage('Laptop'));
  });
});
