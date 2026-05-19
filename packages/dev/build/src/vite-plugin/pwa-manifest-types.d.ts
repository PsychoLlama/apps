declare module 'virtual:pwa-manifest' {
  /**
   * Final URL of the emitted web app manifest. In dev it resolves
   * to the stable `/manifest.webmanifest` path served by the
   * plugin's middleware; in builds it points at the hashed asset
   * under `/_build/assets/`.
   */
  const url: string;
  export default url;
}
