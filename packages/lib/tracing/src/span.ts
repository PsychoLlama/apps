/** A named unit of work within a trace. */
export interface Span {
  /** What this span measures. */
  readonly name: string;
}
