declare const PHANTOM_FIELD: unique symbol;

/** A typed topic identity. Branded symbol carrying a phantom payload type. */
export type Topic<Payload = void> = symbol & {
  readonly [PHANTOM_FIELD]: Payload;
};

/** Create a typed topic. Returns a `Symbol()` with phantom type branding. */
export function defineTopic<Payload = void>(): Topic<Payload> {
  return Symbol() as Topic<Payload>;
}
