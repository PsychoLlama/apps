import { onExit, prepareForExit } from '../exit';

describe('prepareForExit', () => {
  it('runs every registered handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = [onExit(first), onExit(second)];

    prepareForExit();
    unsubscribe.forEach((stop) => stop());

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('skips handlers that unsubscribed', () => {
    const handler = vi.fn();

    onExit(handler)();
    prepareForExit();

    expect(handler).not.toHaveBeenCalled();
  });
});
