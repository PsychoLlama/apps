/**
 * Values bound to vars, by identifier. A matcher's `match` produces one,
 * and a template's `format` consumes one. A splat is bound as `splat`.
 */
export type Context<Ident extends string = string> = Record<Ident, string>;
