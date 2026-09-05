/**
 * The falsy values a class expression is expected to produce. `cond && cls`
 * yields `false`, an absent prop yields `undefined`, a nulled-out ref yields
 * `null`, and a length or count guard (`items.length && cls`) yields `0`.
 *
 * `0` is accepted and dropped rather than rendered, so an empty count can't
 * leak a stray `"0"` class into the output. Other numbers stay out of the
 * set: they are never class names, and rejecting them keeps a stringly-typed
 * value from silently becoming one. An empty string is still a `string` to
 * the type system, but it is skipped at runtime like the rest.
 */
type Falsy = false | 0 | null | undefined;

/** A single class name, or a falsy placeholder standing in for one. */
type ClassName = string | Falsy;

/**
 * A conditional map. Keys are class names, and each is emitted only if its
 * value is truthy — handy when the condition reads better than the class:
 * `{ [css.active]: isActive() }`.
 */
type ClassMap = Record<string, true | Falsy>;

/**
 * Anything `clx` knows how to fold into a class string. Arrays hold plain
 * class names and do not nest; pass a list of lists by spreading it.
 */
export type ClassValue = ClassName | ClassMap | readonly ClassName[];

/**
 * Joins class names into a single string, skipping anything falsy.
 *
 * ```ts
 * clx(css.base, isActive() && css.active, props.class);
 * clx(css.base, { [css.active]: isActive() });
 * ```
 */
export const clx = (value: ClassValue, ...rest: ClassValue[]): string =>
  rest.reduce(append, append('', value));

// Folds one argument into the result string. Split out so the first argument
// and the rest share a code path.
const append = (result: string, value: ClassValue): string => {
  if (!value) return result;

  if (typeof value === 'string') return join(result, value);

  // `Array.isArray` widens a `readonly T[]` to `any[]`, losing the element
  // type, so the branches recover it by assertion.
  if (Array.isArray(value)) {
    return (value as readonly ClassName[]).reduce<string>(
      (names, name) => (name ? join(names, name) : names),
      result,
    );
  }

  return Object.entries(value as ClassMap).reduce<string>(
    (names, [name, enabled]) => (enabled ? join(names, name) : names),
    result,
  );
};

// Concatenates directly rather than collecting into an array to join, so the
// only allocations are the strings themselves. The separator is conditional
// because a leading space would otherwise need trimming off the result.
const join = (result: string, name: string): string =>
  result ? `${result} ${name}` : name;
