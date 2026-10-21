/**
 * Run work for as long as a session lives, without anyone awaiting it. The
 * abort that ends the session is ordinary teardown; any other failure has no
 * caller left to reach, so it surfaces as an unhandled rejection.
 */
export const inBackground = (
  signal: AbortSignal,
  run: () => Promise<unknown>,
): void => {
  void run().catch((error: unknown) => {
    if (!signal.aborted) throw error;
  });
};
