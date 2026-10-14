/**
 * Var identifiers in a literal pattern, or `string` when the pattern isn't
 * known statically. Only extracts identifiers: patterns `parse` rejects aren't
 * caught here.
 */
export type VarIdents<Source extends string> = string extends Source
  ? string
  : | PlaceholderIdents<Source>
    | (Source extends `${string}*${string}` ? 'splat' : never);

// A placeholder is `:`, a letter, then word characters. Any other `:` is
// a literal.
type PlaceholderIdents<Source extends string> =
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
