/** Discriminant for a successfully resolved workflow. */
export const RESOLVED: unique symbol = Symbol();

/** Discriminant for a rejected workflow. */
export const REJECTED: unique symbol = Symbol();

export type Result<T> =
  | { type: typeof RESOLVED; value: T }
  | { type: typeof REJECTED; value: Error };
