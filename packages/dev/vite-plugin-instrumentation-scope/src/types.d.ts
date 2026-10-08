interface ImportMeta {
  /**
   * Build-time scope tag injected by the `instrumentationScope`
   * Vite plugin. Head is the importing module's
   * `package.json#name`; remaining elements are the extensionless
   * path relative to that package's `src/` directory, one segment
   * per array entry. Shape matches otel's instrumentation-scope
   * identity.
   *
   * @example `['@app/main', 'entry-client']`
   */
  readonly INSTRUMENTATION_SCOPE: readonly string[];
}
