import type { ComponentProps } from 'solid-js';
import type Text from '../text';

type TextAs = NonNullable<ComponentProps<typeof Text>['as']>;

describe('Text', () => {
  it('accepts text tags', () => {
    expectTypeOf<'span'>().toExtend<TextAs>();
    expectTypeOf<'p'>().toExtend<TextAs>();
    expectTypeOf<'label'>().toExtend<TextAs>();
  });

  it('rejects "a" — anchors belong to Link', () => {
    expectTypeOf<'a'>().not.toExtend<TextAs>();
  });
});
