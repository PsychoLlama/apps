// Placeholder body for APIs whose types land before their runtime.
export const unimplemented = (...inputs: unknown[]): never => {
  void inputs;
  throw new Error('Not implemented.');
};
