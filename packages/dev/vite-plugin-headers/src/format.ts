import type { HeadersRule } from './headers.ts';

/**
 * Renders rules as the contents of Cloudflare's `_headers`. Rules sharing
 * a pattern merge into one block, placed where the pattern first appears.
 */
export const formatHeaders = (rules: HeadersRule[]): string => {
  const groups = new Map<string, string[]>();

  for (const rule of rules) {
    const lines = groups.get(rule.pattern) ?? [];
    groups.set(rule.pattern, lines);

    for (const [name, value] of Object.entries(rule.headers)) {
      lines.push(`  ${name}: ${value}`);
    }
  }

  const blocks = Array.from(groups, ([pattern, lines]) =>
    [pattern, ...lines].join('\n'),
  );

  return `${blocks.join('\n\n')}\n`;
};
