import { expectTypeOf } from 'vitest';
import type { PolymorphicProps, HtmlTagName } from '../polymorphic';

describe('PolymorphicProps', () => {
  it('includes element-specific attributes for form', () => {
    expectTypeOf<PolymorphicProps<'form'>>().toHaveProperty('action');
    expectTypeOf<PolymorphicProps<'form'>>().toHaveProperty('method');
  });

  it('excludes element-specific attributes from unrelated elements', () => {
    expectTypeOf<PolymorphicProps<'div'>>().not.toHaveProperty('action');
    expectTypeOf<PolymorphicProps<'div'>>().not.toHaveProperty('start');
  });

  it('includes element-specific attributes for ol', () => {
    expectTypeOf<PolymorphicProps<'ol'>>().toHaveProperty('start');
  });

  it('accepts any HTML element', () => {
    expectTypeOf<PolymorphicProps<'address'>>().toHaveProperty('as');
    expectTypeOf<PolymorphicProps<'blockquote'>>().toHaveProperty('cite');
  });

  it('rejects invalid element names', () => {
    // @ts-expect-error — not a valid HTML element.
    expectTypeOf<PolymorphicProps<'fake-element'>>().toBeObject();
  });
});

describe('HtmlTagName', () => {
  it('accepts valid HTML tag names', () => {
    expectTypeOf<'div'>().toMatchTypeOf<HtmlTagName>();
    expectTypeOf<'form'>().toMatchTypeOf<HtmlTagName>();
    expectTypeOf<'address'>().toMatchTypeOf<HtmlTagName>();
  });

  it('rejects non-HTML strings', () => {
    expectTypeOf<'fake-element'>().not.toMatchTypeOf<HtmlTagName>();
  });
});
