/**
 * Babel plugin that drops TypeScript overload signatures (`TSDeclareFunction`
 * — a `function` declaration with no body) before other plugins run.
 *
 * Works around a `solid-refresh` bug that surfaces under Vite 8. To preserve
 * the hoisting semantics of a function declaration, `solid-refresh` rewrites a
 * component's implementation into `var Name = $$component(…)` and lifts it to
 * the top of the module — but it leaves the overload signature behind, so the
 * emitted (still-typed) source declares `Name` twice:
 *
 *     var Text = $$component(_REGISTRY, "Text", function Text(props: …) {…});
 *     // …
 *     function Text<const T extends HtmlTextTag>(props: TextProps<T>): JSX.Element;
 *
 * Vite 7's esbuild pass tolerated that; Vite 8 transforms TypeScript with oxc,
 * whose parser rejects it outright ("Identifier `Text` has already been
 * declared"). Erasing the signature first costs nothing — it carries no runtime
 * meaning, and `tsc` has already checked it against the implementation by the
 * time anything reaches the bundler.
 *
 * Ordering matters only in that this must run in the same Babel pass as
 * `solid-refresh`; `vite-plugin-solid` concatenates user plugins ahead of its
 * own, which is enough.
 */
export const eraseOverloadSignatures = () => ({
  name: 'erase-overload-signatures',
  visitor: {
    TSDeclareFunction(path: { remove: () => void }) {
      path.remove();
    },
  },
});
