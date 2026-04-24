import type { Rule } from 'eslint';
import type { ExportSpecifier } from 'estree';

// SolidStart's lazy route loader (@solidjs/start/src/config/lazy.ts around
// lines 92 and 96) decides whether to rewrite a route source by searching
// for the literal substrings "import" and "export default". Files that
// re-export via `export { default } from '...'` contain neither, so the
// id$$ marker is never injected. The SSR renderer then can't link the
// route back to its chunk, and the HTML ships without preloads for the
// route's CSS and JS bundles. The user sees a flash of unstyled content
// on hydration, and the page renders unstyled with JavaScript disabled.
//
// This is almost certainly a detection bug in SolidStart — the substring
// check is a naive stand-in for real import/export analysis. If it is
// fixed upstream, this rule can be deleted.

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require route files to use `import X from '...'; export default X;` so SolidStart's lazy loader attaches CSS and JS preloads.",
    },
    messages: {
      reexport:
        "Route files must use an explicit `import X from '{{source}}'; export default X;`. `export { ... as default } from '...'` trips SolidStart's substring-based detection, which skips CSS/JS preloads (FOUC on hydration, broken no-JS).",
      localAsDefault:
        "Route files must use an explicit `export default X;`. `export { X as default };` trips SolidStart's substring-based detection, which skips CSS/JS preloads (FOUC on hydration, broken no-JS).",
    },
    schema: [],
  },

  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (!node.specifiers.some(exportsAsDefault)) return;

        if (node.source) {
          context.report({
            node,
            messageId: 'reexport',
            data: { source: String(node.source.value) },
          });
        } else {
          context.report({ node, messageId: 'localAsDefault' });
        }
      },
    };
  },
};

const exportsAsDefault = (spec: ExportSpecifier): boolean =>
  spec.exported.type === 'Identifier' && spec.exported.name === 'default';

export default rule;
