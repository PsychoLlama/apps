/** The deploy environments an option can carry distinct defaults for. */
export const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;

/** One of the known deploy environments. */
export type Environment = (typeof ENVIRONMENTS)[number];

/** Any JSON-serializable value — the universe of legal option payloads. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** A value supplied per environment, used until a runtime override exists. */
export type EnvironmentDefaults<Value extends JsonValue> = Record<
  Environment,
  Value
>;

/**
 * A persisted override of an option's per-environment values. Partial —
 * an environment with no entry falls back to the option's default.
 */
export type Override<Value extends JsonValue> = Partial<
  EnvironmentDefaults<Value>
>;

/**
 * A declared runtime option: a stable ID plus its per-environment
 * defaults. The shape of `Value` is whatever the defaults describe —
 * most commonly `{ enabled: boolean }` for a feature flag.
 */
export interface Option<Value extends JsonValue = { enabled: boolean }> {
  /** Stable identifier, e.g. `my-feature`. Used as the storage key. */
  readonly id: string;
  /** Fallback values indexed by environment. */
  readonly defaults: EnvironmentDefaults<Value>;
}

/**
 * Declare a runtime option. Pairs a stable ID with the default value to
 * use in each environment before any runtime override is loaded.
 *
 * @example
 * const myFeature = defineOption('my-feature', {
 *   dev: { enabled: true },
 *   staging: { enabled: true },
 *   prod: { enabled: false },
 * });
 */
export const defineOption = <Value extends JsonValue = { enabled: boolean }>(
  id: string,
  defaults: EnvironmentDefaults<Value>,
): Option<Value> => ({ id, defaults });
