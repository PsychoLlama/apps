declare module '*.css.ts?css-asset' {
  /**
   * URL of a self-contained, hashed CSS bundle for this `.css.ts`
   * file. Suitable for `<link rel="stylesheet" href={…}>`.
   */
  const url: string;
  export default url;
}
