import { collected } from '../collected';
import { reactive } from '../reactive';
import { resource } from '../resource';
import { disposeOf, yieldOf } from '../task';

describe('yieldOf', () => {
  it('passes plain values through', () => {
    const value = { video: true };

    expect(yieldOf(value)).toBe(value);
  });

  it('unwraps resources to their value', () => {
    expect(yieldOf(resource('stream', () => {}))).toBe('stream');
  });

  it('unwraps reactive outputs to their accessor', () => {
    const state = () => true;

    expect(yieldOf(reactive(state))).toBe(state);
  });

  it('unwraps collected outputs to one stable array', () => {
    const state = () => true;
    const output = collected(
      [resource('stream', () => {}), reactive(state), 1],
      yieldOf,
    );

    expect(yieldOf(output)).toEqual(['stream', state, 1]);
    expect(yieldOf(output)).toBe(yieldOf(output));
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
    expect(
      disposeOf(collected([resource('stream', () => {})], yieldOf)),
    ).toBeUndefined();
    expect(disposeOf(1)).toBeUndefined();
  });
});
