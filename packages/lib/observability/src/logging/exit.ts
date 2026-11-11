const handlers = new Set<() => void>();

/** Run `handler` when the process signals it may end. Returns an unsubscribe. */
export const onExit = (handler: () => void): (() => void) => {
  handlers.add(handler);

  return () => void handlers.delete(handler);
};

/**
 * Signal that this process may end soon, so pending work like unwritten logs
 * gets saved. Call it when the app may stop without warning, such as when the
 * page is hidden. Safe to call more than once.
 */
export const prepareForExit = (): void => {
  handlers.forEach((handler) => handler());
};
