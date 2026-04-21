import { revokeRecording } from '../capabilities';

describe('revokeRecording', () => {
  it('releases the blob URL', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(),
      revokeObjectURL: revoke,
    });

    revokeRecording('blob:abc');

    expect(revoke).toHaveBeenCalledWith('blob:abc');
    vi.unstubAllGlobals();
  });
});
