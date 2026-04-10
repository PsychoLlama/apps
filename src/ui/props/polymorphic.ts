import type { ComponentProps, JSX } from 'solid-js';

/** Any intrinsic element tag name (HTML, SVG, MathML). */
export type TagName = keyof JSX.IntrinsicElements;

/** Any HTML element tag name. */
export type HtmlTagName = keyof JSX.HTMLElementTags;

/** Polymorphic props: a literal `as` tag merged with the element's native attributes. */
export type PolymorphicProps<T extends TagName> = { as: T } & ComponentProps<T>;
