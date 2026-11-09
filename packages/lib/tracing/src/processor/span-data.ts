type AttributeScalar = string | number | boolean | null | undefined;

/** A span attribute value. Anything JSON-serializable, nesting included. */
type AttributeValue =
  | AttributeScalar
  | ReadonlyArray<AttributeValue>
  | { readonly [key: string]: AttributeValue };

type DraftAttributeValue =
  | AttributeScalar
  | DraftAttributeValue[]
  | { [key: string]: DraftAttributeValue };

/** A private copy of a span's attributes, safe to edit in place. */
export type AttributeDraft = Record<string, DraftAttributeValue>;

/** Plain data describing a span. This is what processors receive. */
export type Span = Readonly<{
  /**
   * What this span measures. Low cardinality: use a string literal, with no
   * interpolation.
   */
  name: string;

  /** Identifies this span within its trace. 8 bytes. */
  id: Uint8Array;

  /** Details for the parent span. Null when it's the top level span. */
  parent: null | Readonly<{
    /** The parent's span ID. 8 bytes. */
    id: Uint8Array;
  }>;

  /** Details for the trace, shared by a root span and all its descendants. */
  trace: Readonly<{
    /** Identifies the trace. 16 bytes. */
    id: Uint8Array;
  }>;

  /** Key-value details about this span. */
  attrs: Readonly<Record<string, AttributeValue>>;
}>;

/** A span whose work has started. */
export interface EnteredSpan extends Span {
  /** When the work happened. */
  readonly time: Readonly<{
    /** Unix epoch in milliseconds, fractional digits included. */
    started: number;
  }>;
}

/** A span whose work has finished. */
export interface ExitedSpan extends EnteredSpan {
  /** When the work happened. */
  readonly time: EnteredSpan['time'] &
    Readonly<{
      /** Unix epoch in milliseconds, fractional digits included. */
      ended: number;
    }>;

  /** How the work turned out. */
  readonly status: SpanStatus;
}

/** How a span's work turned out. */
export type SpanStatus = Readonly<
  { code: 'ok' } | { code: 'error'; error: Error }
>;
