/**
 * Strip SMIL animations out of an iconify icon body, hoisting any
 * freeze-state values up to the animated element so the icon renders
 * at its final pose instead of pre-animation. Targets line-md (every
 * icon animates) and the small handful of animated icons in eos /
 * codex; unaffected packs pass through untouched.
 *
 * The implementation is a hand-rolled SVG-fragment tokenizer rather
 * than a full XML parser. Iconify bodies are flat fragments with no
 * comments, CDATA, processing instructions, or attribute values that
 * span tag boundaries — far enough from a general parser's scope that
 * a small dedicated walker stays readable and avoids pulling in a
 * heavy DOM library at build time.
 *
 * Animations covered: `animate`, `animateTransform`, `animateMotion`,
 * `set`, `discard`, `mpath`. Non-`fill="freeze"` animations are still
 * removed (the favicon must be static), but no static value is
 * hoisted — the parent keeps whatever it already declared.
 */

const ANIMATION_TAGS: ReadonlySet<string> = new Set([
  'animate',
  'animateTransform',
  'animateMotion',
  'set',
  'discard',
  'mpath',
]);

interface OpenToken {
  kind: 'open' | 'self';
  tag: string;
  /** Full original text, used for non-mutated re-emission. */
  text: string;
  /** Attribute portion only, for in-place rewrites. */
  attrText: string;
}
interface CloseToken {
  kind: 'close';
  tag: string;
  text: string;
}
interface TextToken {
  kind: 'text';
  text: string;
}
type Token = OpenToken | CloseToken | TextToken;

interface ElementNode {
  type: 'element';
  open: OpenToken;
  children: TreeNode[];
  /** Closing tag for paired elements; absent for self-closing ones. */
  close?: CloseToken;
}
interface TextNode {
  type: 'text';
  text: string;
}
type TreeNode = ElementNode | TextNode;

const TAG_RE = /<\/?[A-Za-z][^>]*>/g;

const tokenize = (body: string): Token[] => {
  const tokens: Token[] = [];
  let pos = 0;
  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(body)) !== null) {
    if (match.index > pos) {
      tokens.push({ kind: 'text', text: body.slice(pos, match.index) });
    }
    const text = match[0];
    pos = match.index + text.length;

    if (text.startsWith('</')) {
      const tag = text.slice(2, -1).trim();
      tokens.push({ kind: 'close', tag, text });
      continue;
    }
    const selfClosing = text.endsWith('/>');
    const inner = selfClosing ? text.slice(1, -2) : text.slice(1, -1);
    const tagEnd = inner.search(/\s/);
    const tag = tagEnd === -1 ? inner : inner.slice(0, tagEnd);
    const attrText = tagEnd === -1 ? '' : inner.slice(tagEnd + 1);
    tokens.push({
      kind: selfClosing ? 'self' : 'open',
      tag,
      text,
      attrText,
    });
  }
  if (pos < body.length) {
    tokens.push({ kind: 'text', text: body.slice(pos) });
  }
  return tokens;
};

const buildTree = (tokens: Token[]): TreeNode[] => {
  const root: ElementNode = {
    type: 'element',
    open: { kind: 'open', tag: '', text: '', attrText: '' },
    children: [],
  };
  const stack: ElementNode[] = [root];
  for (const token of tokens) {
    const top = stack[stack.length - 1];
    if (token.kind === 'text') {
      top.children.push({ type: 'text', text: token.text });
      continue;
    }
    if (token.kind === 'self') {
      top.children.push({ type: 'element', open: token, children: [] });
      continue;
    }
    if (token.kind === 'open') {
      const node: ElementNode = { type: 'element', open: token, children: [] };
      top.children.push(node);
      stack.push(node);
      continue;
    }
    // close — pop the most recent open. Fragments occasionally ship
    // slightly mis-nested; tolerate by popping one level regardless
    // of tag identity.
    if (token.kind === 'close' && stack.length > 1) {
      const closing = stack.pop();
      if (closing) closing.close = token;
    }
  }
  return root.children;
};

const ATTR_RE = /([\w-]+(?::[\w-]+)?)\s*=\s*"([^"]*)"/g;

/** Read a named attribute out of an animation token's attribute text. */
const readAttr = (attrText: string, name: string): string | undefined => {
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(attrText)) !== null) {
    if (match[1] === name) return match[2];
  }
  return undefined;
};

/**
 * Final value an animation freezes onto, per SMIL semantics:
 * `values="…;X"` → last `X`, otherwise `to`, otherwise `from`. Returns
 * `undefined` when the animation declares none of those — without an
 * end state there's nothing to hoist.
 */
const computeFreezeValue = (attrText: string): string | undefined => {
  const values = readAttr(attrText, 'values');
  if (values !== undefined) {
    const parts = values.split(';');
    return parts[parts.length - 1].trim();
  }
  const to = readAttr(attrText, 'to');
  if (to !== undefined) return to;
  return readAttr(attrText, 'from');
};

/** Add or overwrite a single attribute in a token's attribute text. */
const setAttr = (attrText: string, name: string, value: string): string => {
  const escaped = value.replace(/"/g, '&quot;');
  const replaceRe = new RegExp(
    `\\b${name.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}\\s*=\\s*"[^"]*"`,
  );
  if (replaceRe.test(attrText)) {
    return attrText.replace(replaceRe, `${name}="${escaped}"`);
  }
  return attrText.length === 0
    ? `${name}="${escaped}"`
    : `${attrText} ${name}="${escaped}"`;
};

const reopenText = (token: OpenToken): string => {
  if (token.attrText.length === 0) {
    return token.kind === 'self' ? `<${token.tag}/>` : `<${token.tag}>`;
  }
  return token.kind === 'self'
    ? `<${token.tag} ${token.attrText}/>`
    : `<${token.tag} ${token.attrText}>`;
};

const transform = (node: TreeNode): TreeNode => {
  if (node.type === 'text') return node;
  node.children = node.children.map(transform);
  const survivors: TreeNode[] = [];
  for (const child of node.children) {
    if (child.type === 'element' && ANIMATION_TAGS.has(child.open.tag)) {
      // What survives onto the parent depends on the animation type:
      //
      // - `<animate>` / `<animateTransform>` / `<animateMotion>` only
      //   contribute a stable final state when `fill="freeze"`. Without
      //   freeze the value snaps back to the pre-animation declaration,
      //   so we drop the element without hoisting and let whatever
      //   static attribute the parent already declares stand.
      //
      // - `<set>` is conventionally used to hold a value indefinitely
      //   (begin time, no end), so we hoist its `to` regardless of
      //   `fill`. Iconify packs that ship `<set>` (line-md, eos) follow
      //   that convention.
      const fill = readAttr(child.open.attrText, 'fill');
      const attrName = readAttr(child.open.attrText, 'attributeName');
      const shouldHoist = child.open.tag === 'set' || fill === 'freeze';
      if (shouldHoist && attrName) {
        const finalValue = computeFreezeValue(child.open.attrText);
        if (finalValue !== undefined && node.open.kind !== 'self') {
          node.open.attrText = setAttr(
            node.open.attrText,
            attrName,
            finalValue,
          );
          node.open.text = reopenText(node.open);
        }
      }
      continue;
    }
    survivors.push(child);
  }
  node.children = survivors;
  return node;
};

const serialize = (nodes: ReadonlyArray<TreeNode>): string => {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      out += node.text;
      continue;
    }
    out += node.open.text;
    if (node.open.kind === 'self') continue;
    out += serialize(node.children);
    if (node.close) out += node.close.text;
  }
  return out;
};

/**
 * Replace SMIL animation elements with their hoisted freeze-state
 * attribute values. Bodies without animations pass through unchanged
 * (cheap fast-path keyed on substring) so unaffected packs don't
 * pay for the parse.
 */
export const stripAnimations = (body: string): string => {
  let mightAnimate = false;
  for (const tag of ANIMATION_TAGS) {
    if (body.includes(`<${tag}`)) {
      mightAnimate = true;
      break;
    }
  }
  if (!mightAnimate) return body;
  const tokens = tokenize(body);
  const tree = buildTree(tokens).map(transform);
  return serialize(tree);
};
