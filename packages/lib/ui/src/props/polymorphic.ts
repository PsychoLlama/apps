import type { ComponentProps, JSX } from 'solid-js';

/** Any intrinsic element tag name (HTML, SVG, MathML). */
export type TagName = keyof JSX.IntrinsicElements;

/** Any HTML element tag name. */
export type HtmlTagName = keyof JSX.HTMLElementTags;

/** Heading level elements. */
export type HtmlHeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Inline and block text elements. Excludes `'a'` — anchors must flow
 * through `<Link>` so client-side routing, focus styling, and underline
 * defaults stay centralized.
 */
export type HtmlTextTag =
  | 'span'
  | 'p'
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
  | 'blockquote'
  | 'pre';

/**
 * Form-control elements. Each is owned by a dedicated component
 * (`TextField`, `TextArea`, future `Select`/`Checkbox`/etc.) and
 * carries non-trivial behavior — focus delegation, value semantics,
 * accessibility wiring — that doesn't survive being slotted into a
 * generic layout primitive. Excluded from `HtmlBoxTag` so a stray
 * `<Flex as="input">` is rejected at the type level.
 */
export type HtmlFormControlTag =
  | 'input'
  | 'textarea'
  | 'select'
  | 'option'
  | 'optgroup'
  | 'button'
  | 'fieldset'
  | 'legend'
  | 'datalist'
  | 'meter'
  | 'progress'
  | 'output';

/**
 * Layout and structural elements. Excludes text, heading, anchor, and
 * form-control tags. Includes list-item tags (`li`, `dt`, `dd`) —
 * they're structural containers that may hold any layout, not
 * text-only elements. Anchor is excluded so consumers route through
 * `<Link>`; components that legitimately render as an anchor (e.g.
 * `Card`) widen their own tag set explicitly.
 */
export type HtmlBoxTag = Exclude<
  HtmlTagName,
  HtmlTextTag | HtmlHeadingTag | HtmlFormControlTag | 'a'
>;

/** Polymorphic props: a literal `as` tag merged with the element's native attributes. Component props take precedence over native attributes. */
export type PolymorphicProps<T extends TagName, Own> = { as: T } & Omit<
  ComponentProps<T>,
  keyof Own
> &
  Own;
