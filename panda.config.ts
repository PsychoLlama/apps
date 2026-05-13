import { defineConfig } from '@pandacss/dev';

/**
 * Panda CSS config for the workspace.
 *
 * Panda is being introduced alongside Vanilla Extract as part of an
 * incremental migration. Both compilers run in parallel for now: VE
 * processes `*.css.ts` files, Panda extracts atomic styles from
 * `css()`/`cva()`/`styled()` calls inside `.ts`/`.tsx` source.
 *
 * Generated artifacts land in `@lib/styled-system`. The directory is
 * gitignored — codegen is deterministic from this file plus the
 * scanned source, and is regenerated on every install via the root
 * `prepare` script.
 */
export default defineConfig({
  // We ship our own CSS reset (`the-new-css-reset`) and design opinions
  // from `@lib/design`. Panda's preflight would re-apply opinions we
  // already control elsewhere.
  preflight: false,

  // Files to scan for `css()`, `cva()`, `styled()`, etc. usages.
  // `.css.ts` files belong to Vanilla Extract; skipping them avoids
  // double-work and false positives during the migration.
  include: ['./packages/*/*/src/**/*.{ts,tsx}'],
  exclude: ['**/*.css.ts'],

  // No `jsxFramework` — the `<styled.div>` factory and JSX-form
  // patterns (`<HStack>`, `<Box>`, etc.) are intentionally not
  // generated. We keep the function-form `patterns/` API (`hstack({…})`
  // returns a class string) so layout primitives are still available
  // without forcing a parallel set of components alongside `@lib/ui`.

  // Output lives inside the workspace package; the package's `exports`
  // map points at these subpaths. Codegen drops files only — no
  // `package.json` — so the hand-authored manifest stays in charge.
  outdir: 'packages/lib/styled-system/src',
  outExtension: 'mjs',

  // Wipe stale output on each codegen so renames/removals don't leak.
  clean: true,

  // Token themes will be filled in as the migration progresses. Keep
  // the surface explicit and empty for now so usages fail loudly until
  // the corresponding token lands here.
  theme: {
    extend: {},
  },
});
