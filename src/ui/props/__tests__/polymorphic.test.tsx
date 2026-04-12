import { expectTypeOf } from 'vitest';
import type {
  PolymorphicProps,
  HtmlTagName,
  HtmlTextTag,
  HtmlHeadingTag,
  HtmlBoxTag,
} from '../polymorphic';

interface TestOwn {
  custom: string;
}

describe('PolymorphicProps', () => {
  it('includes element-specific attributes for form', () => {
    expectTypeOf<PolymorphicProps<'form', TestOwn>>().toHaveProperty('action');
    expectTypeOf<PolymorphicProps<'form', TestOwn>>().toHaveProperty('method');
  });

  it('excludes element-specific attributes from unrelated elements', () => {
    expectTypeOf<PolymorphicProps<'div', TestOwn>>().not.toHaveProperty(
      'action',
    );
    expectTypeOf<PolymorphicProps<'div', TestOwn>>().not.toHaveProperty(
      'start',
    );
  });

  it('includes element-specific attributes for ol', () => {
    expectTypeOf<PolymorphicProps<'ol', TestOwn>>().toHaveProperty('start');
  });

  it('accepts any HTML element', () => {
    expectTypeOf<PolymorphicProps<'address', TestOwn>>().toHaveProperty('as');
    expectTypeOf<PolymorphicProps<'blockquote', TestOwn>>().toHaveProperty(
      'cite',
    );
  });

  it('rejects invalid element names', () => {
    // @ts-expect-error — not a valid HTML element.
    expectTypeOf<PolymorphicProps<'fake-element', TestOwn>>().toBeObject();
  });

  it('lets component props override native attributes', () => {
    interface Override {
      action: number;
    }

    type Props = PolymorphicProps<'form', Override>;

    expectTypeOf<Props['action']>().toEqualTypeOf<number>();
  });
});

describe('HtmlTagName', () => {
  it('accepts valid HTML tag names', () => {
    expectTypeOf<'div'>().toExtend<HtmlTagName>();
    expectTypeOf<'form'>().toExtend<HtmlTagName>();
    expectTypeOf<'address'>().toExtend<HtmlTagName>();
  });

  it('rejects non-HTML strings', () => {
    expectTypeOf<'fake-element'>().not.toExtend<HtmlTagName>();
  });
});

describe('HtmlTextTag', () => {
  it('includes inline text elements', () => {
    expectTypeOf<'span'>().toExtend<HtmlTextTag>();
    expectTypeOf<'em'>().toExtend<HtmlTextTag>();
    expectTypeOf<'code'>().toExtend<HtmlTextTag>();
  });

  it('includes block text elements', () => {
    expectTypeOf<'p'>().toExtend<HtmlTextTag>();
    expectTypeOf<'blockquote'>().toExtend<HtmlTextTag>();
    expectTypeOf<'pre'>().toExtend<HtmlTextTag>();
  });

  it('excludes layout and heading elements', () => {
    expectTypeOf<'div'>().not.toExtend<HtmlTextTag>();
    expectTypeOf<'h1'>().not.toExtend<HtmlTextTag>();
    expectTypeOf<'nav'>().not.toExtend<HtmlTextTag>();
  });
});

describe('HtmlHeadingTag', () => {
  it('includes all heading levels', () => {
    expectTypeOf<'h1'>().toExtend<HtmlHeadingTag>();
    expectTypeOf<'h6'>().toExtend<HtmlHeadingTag>();
  });

  it('excludes non-heading elements', () => {
    expectTypeOf<'p'>().not.toExtend<HtmlHeadingTag>();
    expectTypeOf<'div'>().not.toExtend<HtmlHeadingTag>();
  });
});

describe('HtmlBoxTag', () => {
  it('includes layout elements', () => {
    expectTypeOf<'div'>().toExtend<HtmlBoxTag>();
    expectTypeOf<'section'>().toExtend<HtmlBoxTag>();
    expectTypeOf<'nav'>().toExtend<HtmlBoxTag>();
    expectTypeOf<'form'>().toExtend<HtmlBoxTag>();
  });

  it('excludes text elements', () => {
    expectTypeOf<'span'>().not.toExtend<HtmlBoxTag>();
    expectTypeOf<'p'>().not.toExtend<HtmlBoxTag>();
    expectTypeOf<'em'>().not.toExtend<HtmlBoxTag>();
  });

  it('excludes heading elements', () => {
    expectTypeOf<'h1'>().not.toExtend<HtmlBoxTag>();
    expectTypeOf<'h3'>().not.toExtend<HtmlBoxTag>();
  });
});
