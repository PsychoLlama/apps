/**
 * Runtime configuration — feature flags and other values resolved at
 * runtime rather than build time.
 *
 * Intended to be backed by async OPFS so flags persist across sessions
 * without a network round-trip. The storage layer is not implemented yet;
 * this entry point exists to anchor the package.
 */

export {};
