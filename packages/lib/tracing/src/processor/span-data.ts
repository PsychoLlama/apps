// Mirrors holz's log context, minus its `error` field. Spans are plain data,
// and a failure is an outcome of the span rather than a detail describing it.
/** A span attribute value. Anything JSON-serializable, nesting included. */
type AttributeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<AttributeValue>
  | { readonly [key: string]: AttributeValue };

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

/** A failure, reduced to plain data. */
export type SpanError = Readonly<{
  /** The kind of failure, taken from the error's name. */
  type: string;

  /** The error's message. */
  message: string;

  /** The error's stack trace, if it has one. */
  stack: null | string;
}>;

/** How a span's work turned out. */
export type SpanStatus =
  Readonly<{ code: 'ok' }> | Readonly<{ code: 'error'; error: SpanError }>;
