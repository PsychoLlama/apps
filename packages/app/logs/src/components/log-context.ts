/** A JSON value as it sits in a log's context, minus `undefined`. */
export type AttributeValue =
  | string
  | number
  | boolean
  | null
  | readonly AttributeValue[]
  | { readonly [key: string]: AttributeValue | undefined };

/** A table row: a dotted path to a leaf and the value there. */
export interface AttributeEntry {
  /** Dotted path from the context root, e.g. `viewport.width`. */
  key: string;
  value: AttributeValue;
}

// Read loosely: the typed `LogContext` only admits an `Error` under `error`,
// but whatever a producer wrote is what comes back from disk.
type AttributeObject = { readonly [key: string]: unknown };

const isObject = (value: unknown): value is AttributeObject =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Error);

// Top-level errors render as callouts, not rows. IndexedDB's structured
// clone keeps them `Error` instances, so `instanceof` still finds them.
const isAttribute = (value: unknown): boolean =>
  value !== undefined && !(value instanceof Error);

/**
 * The context's top-level `Error` values, in key order. Each one shows as a
 * callout under the message rather than a row in the attribute table.
 */
export const contextErrors = (context: AttributeObject): Error[] =>
  Object.values(context).filter((value) => value instanceof Error);

/**
 * Whether the context holds anything for the attribute table. Cheap enough
 * for every entry, so only logs with something to show can expand.
 */
export const hasAttributes = (context: AttributeObject): boolean =>
  Object.values(context).some(isAttribute);

/**
 * Flatten context into rows, depth first in key order. Objects descend and
 * get no row of their own; arrays and primitives are leaves, so an object
 * inside an array stays inside it. An empty object is a leaf, or it would
 * vanish. `undefined` drops, as it does in JSON, and top-level errors are
 * left to {@link contextErrors}.
 */
export const flattenAttributes = (
  context: AttributeObject,
): AttributeEntry[] => {
  const entries: AttributeEntry[] = [];

  const visit = (prefix: string, object: AttributeObject): void => {
    for (const [key, value] of Object.entries(object)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (!isAttribute(value)) continue;
      if (isObject(value) && Object.keys(value).length > 0) visit(path, value);
      else entries.push({ key: path, value: value as AttributeValue });
    }
  };

  visit('', context);
  return entries;
};
