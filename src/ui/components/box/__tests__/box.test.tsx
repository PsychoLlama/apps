import { expectTypeOf } from 'vitest';
import type { BoxProps } from '../box';

describe('BoxProps', () => {
  it('includes design token props', () => {
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('background');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('radius');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('shadow');
  });

  it('includes spacing props', () => {
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('p');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('px');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('py');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('m');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('mx');
    expectTypeOf<BoxProps<'div'>>().toHaveProperty('my');
  });

  it('includes element-specific attributes', () => {
    expectTypeOf<BoxProps<'form'>>().toHaveProperty('action');
    expectTypeOf<BoxProps<'ol'>>().toHaveProperty('start');
  });
});
