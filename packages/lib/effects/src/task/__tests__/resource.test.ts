import { resource } from '../resource';

describe('resource', () => {
  it('pairs a value with its cleanup', () => {
    const dispose = vi.fn();
    const handle = resource('stream', dispose);

    expect(handle.value).toBe('stream');
    expect(handle.dispose).toBe(dispose);
  });
});
