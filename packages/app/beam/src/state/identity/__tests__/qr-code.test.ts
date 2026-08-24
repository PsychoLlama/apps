/**
 * Unit tests for the QR cell. The grid is a byte buffer, so it's a cell
 * rather than store state — and it lands on its own schedule, which is the
 * thing worth pinning down.
 */

import { createTestRuntime } from '@lib/state';
import type { QrGrid } from '../../platform/qr-code';
import { codeEncodedTopic, qrCodeCell } from '../qr-code';
import { identityResolvedTopic } from '../identity';
import { sessionCell } from '../../network/connection';
import { beamScope } from '../../scope';

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(beamScope);
  return { ...runtime, release };
};

describe('codeEncodedTopic', () => {
  it('holds the encoded grid', () => {
    const { commit, peek } = setup();

    commit(codeEncodedTopic(fakeGrid));

    expect(peek(qrCodeCell)).toBe(fakeGrid);
  });

  it('leaves the code empty when the encode failed', () => {
    const { commit, peek } = setup();

    commit(codeEncodedTopic(null));

    expect(peek(qrCodeCell)).toBeNull();
  });

  it('lands without waiting for the relay connection', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic('ep-1'));
    commit(codeEncodedTopic(fakeGrid));

    // The code encodes the link, and the link is the address the key
    // implies — so the invite is complete before the handshake is.
    expect(peek(qrCodeCell)).toBe(fakeGrid);
    expect(peek(sessionCell)).toBeNull();
  });
});
