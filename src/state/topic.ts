declare const PHANTOM_FIELD: unique symbol;

/** A typed topic identity. Branded symbol carrying a phantom payload type. */
export type Topic<Payload = void> = symbol & {
  readonly [PHANTOM_FIELD]: Payload;
};

/** Create a typed topic. Alias for `Symbol()` with phantom type branding. */
export const defineTopic: <Payload = void>() => Topic<Payload> =
  Symbol as never;
