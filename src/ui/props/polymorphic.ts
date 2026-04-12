import type { ComponentProps, JSX } from 'solid-js';

/** Any intrinsic element tag name (HTML, SVG, MathML). */
export type TagName = keyof JSX.IntrinsicElements;

/** Any HTML element tag name. */
export type HtmlTagName = keyof JSX.HTMLElementTags;

/** Heading level elements. */
export type HtmlHeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/** Inline and block text elements. */
export type HtmlTextTag =
  | 'span'
  | 'p'
  | 'a'
  | 'label'
  | 'em'
  | 'strong'
  | 'b'
  | 'i'
  | 's'
  | 'u'
  | 'small'
  | 'code'
  | 'kbd'
  | 'samp'
  | 'abbr'
  | 'cite'
  | 'dfn'
  | 'mark'
  | 'q'
  | 'sub'
  | 'sup'
  | 'time'
  | 'var'
  | 'del'
  | 'ins'
  | 'li'
  | 'dt'
  | 'dd'
  | 'blockquote'
  | 'pre';

/** Layout and structural elements. Excludes text and heading tags. */
export type HtmlBoxTag = Exclude<HtmlTagName, HtmlTextTag | HtmlHeadingTag>;

/** Polymorphic props: a literal `as` tag merged with the element's native attributes. Component props take precedence over native attributes. */
export type PolymorphicProps<T extends TagName, Own = {}> = { as: T } & Omit<
  ComponentProps<T>,
  keyof Own
> &
  Own;
