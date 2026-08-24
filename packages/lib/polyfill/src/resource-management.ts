/**
 * Installs `Symbol.dispose` and `Symbol.asyncDispose` where the runtime lacks
 * them. Import for side effects from any module declaring a disposable:
 *
 * ```ts
 * import '@lib/polyfill/resource-management';
 * ```
 *
 * `using` binds the symbol when the class body evaluates, so importing this
 * from an app entry is too late — the entry's own body runs after every module
 * it imports. Only a direct dependency edge orders it correctly.
 */

// `Symbol.for`, not `Symbol()`: it's the registered key compiled `using`
// helpers fall back to, and it stays identical across bundles and realms.
const install = (name: 'dispose' | 'asyncDispose'): void => {
  if (name in Symbol) return;

  // Bare assignment would leave it enumerable, unlike the native descriptor.
  Object.defineProperty(Symbol, name, {
    value: Symbol.for(`Symbol.${name}`),
  });
};

install('dispose');
install('asyncDispose');
