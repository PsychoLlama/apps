/**
 * Identifiers of the `:name` placeholders in a literal string. Matchers
 * and templates share this syntax: `:`, a letter, then word characters.
 * Any other `:` is a literal.
 */
export type PlaceholderIdents<Source extends string> =
  Source extends `${string}:${infer Rest}`
    ? Rest extends `${Letter}${string}`
      ? TakeWord<Rest> extends [infer Ident, infer Tail extends string]
        ? Ident | PlaceholderIdents<Tail>
        : never
      : PlaceholderIdents<Rest>
    : never;

// Splits leading word characters off a string: `[word, rest]`.
type TakeWord<
  Text extends string,
  Word extends string = '',
> = Text extends `${infer Char}${infer Rest}`
  ? Char extends WordChar
    ? TakeWord<Rest, `${Word}${Char}`>
    : [Word, Text]
  : [Word, Text];

type WordChar = Letter | Chars<'0123456789_'>;
type Letter = Chars<'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'>;

// The characters of a string, as a union.
type Chars<
  Text extends string,
  Found extends string = never,
> = Text extends `${infer Char}${infer Rest}`
  ? Chars<Rest, Found | Char>
  : Found;
