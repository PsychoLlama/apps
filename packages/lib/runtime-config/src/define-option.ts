/**
 * The deploy environments an option can carry distinct defaults for. Named
 * to match Vite's build modes one-to-one (`development`, `staging`,
 * `production`) so {@link resolveEnvironment} maps a mode to an environment
 * without translation.
 */
export const ENVIRONMENTS = ['development', 'staging', 'production'] as const;

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
  /** Stable identifier, e.g. `@app/beta`. Used as the storage key. */
  readonly id: string;
  /** Fallback values indexed by environment. */
  readonly defaults: EnvironmentDefaults<Value>;
}

/**
 * Declare a runtime option. Pairs a stable ID with the default value to
 * use in each environment before any runtime override is loaded.
 *
 * @example
 * const myFeature = defineOption('@app/beta', {
 *   development: { enabled: true },
 *   staging: { enabled: true },
 *   production: { enabled: false },
 * });
 */
export const defineOption = <Value extends JsonValue = { enabled: boolean }>(
  id: string,
  // `NoInfer` keeps `defaults` from being an inference source: a mismatched
  // environment would otherwise widen `Value` to a union, deferring the error
  // to the read site. Blocking inference pins `Value` to the default (or an
  // explicit generic) so each environment is checked here, at the definition.
  defaults: EnvironmentDefaults<NoInfer<Value>>,
): Option<Value> => ({ id, defaults });
