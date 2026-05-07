// TypeScript wildcard module declarations only allow a single `*`,
// so each PNG size needs its own entry rather than a single
// generic `*.svg?to-png=*` pattern. Add a new line here when
// introducing a new size.

declare module '*.svg?to-png=180' {
  const url: string;
  export default url;
}

declare module '*.svg?to-png=192' {
  const url: string;
  export default url;
}

declare module '*.svg?to-png=512' {
  const url: string;
  export default url;
}
