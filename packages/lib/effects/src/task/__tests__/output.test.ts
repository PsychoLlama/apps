import {
  collected,
  disposeOf,
  isWrapped,
  reactive,
  resource,
  yieldOf,
} from '../output';

describe('output', () => {
  describe('resource', () => {
    it('pairs a value with its cleanup', () => {
      const dispose = vi.fn();
      const handle = resource('stream', dispose);

      expect(isWrapped(handle, 'resource')).toBe(true);
      expect(handle.value).toBe('stream');
      expect(handle.dispose).toBe(dispose);
    });
  });

  describe('reactive', () => {
    it('pairs an accessor with its cleanup', () => {
      const state = () => true;
      const dispose = vi.fn();
      const output = reactive(state, dispose);

      expect(isWrapped(output, 'reactive')).toBe(true);
      expect(output.value).toBe(state);
      expect(output.dispose).toBe(dispose);
    });

    it('makes the cleanup optional', () => {
      expect(reactive(() => true).dispose).toBeUndefined();
    });
  });

  describe('collected', () => {
    it('unwraps its items once, to one stable array', () => {
      const state = () => true;
      const items = [resource('stream', () => {}), reactive(state), 1];
      const output = collected(items);

      expect(isWrapped(output, 'collected')).toBe(true);
      expect(output.items).toBe(items);
      expect(output.value).toEqual(['stream', state, 1]);
      expect(yieldOf(output)).toBe(output.value);
    });
  });

  describe('isWrapped', () => {
    it('tells wrapped outputs apart from plain values', () => {
      expect(isWrapped(resource('stream', () => {}))).toBe(true);
      expect(isWrapped(reactive(() => true))).toBe(true);
      expect(isWrapped(collected([]))).toBe(true);
      expect(isWrapped(() => true)).toBe(false);
      expect(isWrapped({ value: 1 })).toBe(false);
      expect(isWrapped(null)).toBe(false);
    });

    it('checks the kind when given one', () => {
      const output = resource('stream', () => {});

      expect(isWrapped(output, 'resource')).toBe(true);
      expect(isWrapped(output, 'reactive')).toBe(false);
      expect(isWrapped(1, 'resource')).toBe(false);
    });
  });

  describe('yieldOf', () => {
    it('unwraps to what downstream receives', () => {
      const state = () => true;
      const value = { video: true };

      expect(yieldOf(value)).toBe(value);
      expect(yieldOf(resource('stream', () => {}))).toBe('stream');
      expect(yieldOf(reactive(state))).toBe(state);
    });
  });

  describe('disposeOf', () => {
    it('finds the cleanup on resources and reactive outputs', () => {
      const dispose = () => {};

      expect(disposeOf(resource('stream', dispose))).toBe(dispose);
      expect(disposeOf(reactive(() => true, dispose))).toBe(dispose);
    });

    it('finds none elsewhere', () => {
      expect(disposeOf(reactive(() => true))).toBeUndefined();
      expect(disposeOf(collected([resource('s', () => {})]))).toBeUndefined();
      expect(disposeOf(1)).toBeUndefined();
    });
  });
});
