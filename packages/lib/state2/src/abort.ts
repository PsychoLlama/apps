/** Error used when a scope release cancels in-flight sagas. */
export const abortError = (): Error =>
  Object.assign(new Error('Scope released; in-flight work aborted'), {
    name: 'AbortError',
  });

/** Whether an error came from cancellation rather than real failure. */
export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';
