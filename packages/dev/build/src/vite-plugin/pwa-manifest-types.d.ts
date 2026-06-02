declare module 'virtual:pwa-manifest' {
  /**
   * URL of the emitted web app manifest — the stable, unhashed
   * `/manifest.webmanifest` in every environment. Dev serves it from
   * the plugin's middleware; builds emit it at the root (off the
   * `immutable` `/_build/` prefix) so installed PWAs can re-fetch a
   * constant URL and pick up updates.
   */
  const url: string;
  export default url;
}
