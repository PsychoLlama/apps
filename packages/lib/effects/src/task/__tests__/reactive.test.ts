import { isReactive, reactive } from '../reactive';
import { resource } from '../resource';

describe('reactive', () => {
  it('pairs an accessor with its cleanup', () => {
    const state = () => true;
    const dispose = vi.fn();
    const output = reactive(state, dispose);

    expect(output.state).toBe(state);
    expect(output.dispose).toBe(dispose);
  });

  it('makes the cleanup optional', () => {
    expect(reactive(() => true).dispose).toBeUndefined();
  });

  it('is told apart from other outputs', () => {
    expect(isReactive(reactive(() => true))).toBe(true);
    expect(isReactive(resource('stream', () => {}))).toBe(false);
    expect(isReactive(() => true)).toBe(false);
    expect(isReactive(null)).toBe(false);
  });
});
