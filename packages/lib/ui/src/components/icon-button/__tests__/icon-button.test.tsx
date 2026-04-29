import type { IconButtonProps } from '../icon-button';

describe('IconButtonProps', () => {
  it('accepts aria-label alone', () => {
    expectTypeOf<{
      testId: 'x';
      'aria-label': 'Close';
    }>().toExtend<IconButtonProps>();
  });

  it('accepts aria-labelledby alone', () => {
    expectTypeOf<{
      testId: 'x';
      'aria-labelledby': 'heading-id';
    }>().toExtend<IconButtonProps>();
  });

  it('rejects neither — an icon-only button needs a name', () => {
    expectTypeOf<{ testId: 'x' }>().not.toExtend<IconButtonProps>();
  });

  it('rejects both — aria-labelledby would shadow aria-label silently', () => {
    expectTypeOf<{
      testId: 'x';
      'aria-label': 'Close';
      'aria-labelledby': 'heading-id';
    }>().not.toExtend<IconButtonProps>();
  });
});
