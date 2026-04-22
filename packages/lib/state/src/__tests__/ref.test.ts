import { Ref, ref } from '../ref';
import { createStore } from 'solid-js/store';

describe('ref', () => {
  it('wraps a value in a Ref', () => {
    const handle = ref({ name: 'jesse' });

    expect(handle).toBeInstanceOf(Ref);
    expect(handle.current).toEqual({ name: 'jesse' });
  });

  it('exposes the original value by reference identity', () => {
    const value = { mark: 'live' };
    const handle = ref(value);

    expect(handle.current).toBe(value);
  });

  it('is not proxied when placed in a SolidJS store', () => {
    const original = { flag: true };
    const handle = ref(original);
    const [state] = createStore({ handle });

    // Class instances are treated as opaque leaves by createStore, so
    // `.current` resolves to the exact object we wrapped.
    // eslint-disable-next-line solid/reactivity -- identity assertion, no tracking needed
    expect(state.handle.current).toBe(original);
  });
});
