import { expectTypeOf } from 'vitest';
import type {
  PolymorphicProps,
  HtmlTagName,
  HtmlTextTag,
  HtmlHeadingTag,
  HtmlBoxTag,
} from '../polymorphic';

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

describe('HtmlTextTag', () => {
  it('includes inline text elements', () => {
    expectTypeOf<'span'>().toMatchTypeOf<HtmlTextTag>();
    expectTypeOf<'em'>().toMatchTypeOf<HtmlTextTag>();
    expectTypeOf<'code'>().toMatchTypeOf<HtmlTextTag>();
  });

  it('includes block text elements', () => {
    expectTypeOf<'p'>().toMatchTypeOf<HtmlTextTag>();
    expectTypeOf<'blockquote'>().toMatchTypeOf<HtmlTextTag>();
    expectTypeOf<'pre'>().toMatchTypeOf<HtmlTextTag>();
  });

  it('excludes layout and heading elements', () => {
    expectTypeOf<'div'>().not.toMatchTypeOf<HtmlTextTag>();
    expectTypeOf<'h1'>().not.toMatchTypeOf<HtmlTextTag>();
    expectTypeOf<'nav'>().not.toMatchTypeOf<HtmlTextTag>();
  });
});

describe('HtmlHeadingTag', () => {
  it('includes all heading levels', () => {
    expectTypeOf<'h1'>().toMatchTypeOf<HtmlHeadingTag>();
    expectTypeOf<'h6'>().toMatchTypeOf<HtmlHeadingTag>();
  });

  it('excludes non-heading elements', () => {
    expectTypeOf<'p'>().not.toMatchTypeOf<HtmlHeadingTag>();
    expectTypeOf<'div'>().not.toMatchTypeOf<HtmlHeadingTag>();
  });
});

describe('HtmlBoxTag', () => {
  it('includes layout elements', () => {
    expectTypeOf<'div'>().toMatchTypeOf<HtmlBoxTag>();
    expectTypeOf<'section'>().toMatchTypeOf<HtmlBoxTag>();
    expectTypeOf<'nav'>().toMatchTypeOf<HtmlBoxTag>();
    expectTypeOf<'form'>().toMatchTypeOf<HtmlBoxTag>();
  });

  it('excludes text elements', () => {
    expectTypeOf<'span'>().not.toMatchTypeOf<HtmlBoxTag>();
    expectTypeOf<'p'>().not.toMatchTypeOf<HtmlBoxTag>();
    expectTypeOf<'em'>().not.toMatchTypeOf<HtmlBoxTag>();
  });

  it('excludes heading elements', () => {
    expectTypeOf<'h1'>().not.toMatchTypeOf<HtmlBoxTag>();
    expectTypeOf<'h3'>().not.toMatchTypeOf<HtmlBoxTag>();
  });
});
