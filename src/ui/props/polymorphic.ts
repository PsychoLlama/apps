import type { ComponentProps, JSX } from 'solid-js';

/** Any HTML element tag name. */
export type HtmlTagName = keyof JSX.HTMLElementTags;

/** Polymorphic props: a literal `as` tag merged with the element's native HTML attributes. */
export type PolymorphicProps<T extends HtmlTagName> = {
  as: T;
} & ComponentProps<T>;
