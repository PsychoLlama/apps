/**
 * Pattern override for the environment filter. In dev, force everything
 * on (`*`) so logs surface with no `DEBUG` env var / `debug`
 * localStorage key required. In prod, stay `undefined` so the filter
 * falls back to its configured env source (silent unless opted in).
 *
 * `import.meta.env.DEV` is statically replaced by Vite, so the prod
 * bundle folds this to `undefined` and drops the branch.
 */
export const devPattern: '*' | undefined = import.meta.env.DEV
  ? '*'
  : undefined;
