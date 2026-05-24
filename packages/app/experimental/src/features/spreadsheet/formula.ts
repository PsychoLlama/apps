/**
 * Formula language. A tiny recursive-descent parser/evaluator over the
 * raw cell map. Each evaluation walks dependencies live, so reactive
 * reads through the SolidJS store proxy give us automatic re-render
 * when a referenced cell's raw text changes.
 *
 * Grammar:
 *   expr   := term (('+' | '-') term)*
 *   term   := unary (('*' | '/') unary)*
 *   unary  := '-' unary | primary
 *   primary := NUMBER
 *           | IDENT '(' arglist? ')'        — function call
 *           | IDENT (':' IDENT)?            — cell ref or range
 *           | '(' expr ')'
 *   arglist := arg (',' arg)*
 */

import type { CellMap } from './store';
import type { CellId } from './grid';

/** Result of evaluating a cell: a number, an empty marker, or an error. */
export type CellValue =
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string }
  | { kind: 'empty' }
  | { kind: 'error'; reason: string };

interface NumberToken {
  type: 'number';
  value: number;
}
interface IdentToken {
  type: 'ident';
  value: string;
}
interface PunctToken {
  type: 'punct';
  value: '+' | '-' | '*' | '/' | '(' | ')' | ',' | ':';
}
type Token = NumberToken | IdentToken | PunctToken;

const isDigit = (char: string): boolean => char >= '0' && char <= '9';
const isAlpha = (char: string): boolean =>
  (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z');

const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (char === ' ' || char === '\t') {
      index += 1;
      continue;
    }
    if (
      char === '+' ||
      char === '-' ||
      char === '*' ||
      char === '/' ||
      char === '(' ||
      char === ')' ||
      char === ',' ||
      char === ':'
    ) {
      tokens.push({ type: 'punct', value: char });
      index += 1;
      continue;
    }
    if (isDigit(char) || char === '.') {
      let end = index;
      let seenDot = false;
      while (end < input.length) {
        const next = input[end];
        if (isDigit(next)) {
          end += 1;
        } else if (next === '.' && !seenDot) {
          seenDot = true;
          end += 1;
        } else {
          break;
        }
      }
      const numeric = Number.parseFloat(input.slice(index, end));
      if (Number.isNaN(numeric)) {
        throw new Error(`bad number: ${input.slice(index, end)}`);
      }
      tokens.push({ type: 'number', value: numeric });
      index = end;
      continue;
    }
    if (isAlpha(char)) {
      let end = index + 1;
      while (end < input.length) {
        const next = input[end];
        if (isAlpha(next) || isDigit(next)) {
          end += 1;
        } else {
          break;
        }
      }
      tokens.push({ type: 'ident', value: input.slice(index, end) });
      index = end;
      continue;
    }
    throw new Error(`unexpected character: ${char}`);
  }
  return tokens;
};

interface Cursor {
  tokens: Token[];
  pos: number;
}

const peek = (cursor: Cursor): Token | undefined => cursor.tokens[cursor.pos];
const consume = (cursor: Cursor): Token | undefined => {
  const token = cursor.tokens[cursor.pos];
  cursor.pos += 1;
  return token;
};
const matchPunct = (cursor: Cursor, value: PunctToken['value']): boolean => {
  const head = peek(cursor);
  if (head?.type === 'punct' && head.value === value) {
    cursor.pos += 1;
    return true;
  }
  return false;
};

/** AST nodes the evaluator walks. */
type Node =
  | { kind: 'num'; value: number }
  | { kind: 'cell'; id: CellId }
  | { kind: 'range'; from: CellId; to: CellId }
  | { kind: 'neg'; value: Node }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/'; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] };

const parseExpr = (cursor: Cursor): Node => {
  let left = parseTerm(cursor);
  while (true) {
    const head = peek(cursor);
    if (head?.type !== 'punct') break;
    if (head.value !== '+' && head.value !== '-') break;
    cursor.pos += 1;
    const right = parseTerm(cursor);
    left = { kind: 'bin', op: head.value, left, right };
  }
  return left;
};

const parseTerm = (cursor: Cursor): Node => {
  let left = parseUnary(cursor);
  while (true) {
    const head = peek(cursor);
    if (head?.type !== 'punct') break;
    if (head.value !== '*' && head.value !== '/') break;
    cursor.pos += 1;
    const right = parseUnary(cursor);
    left = { kind: 'bin', op: head.value, left, right };
  }
  return left;
};

const parseUnary = (cursor: Cursor): Node => {
  if (matchPunct(cursor, '-')) {
    return { kind: 'neg', value: parseUnary(cursor) };
  }
  return parsePrimary(cursor);
};

const looksLikeCellId = (text: string): boolean => {
  // One or more letters followed by one or more digits.
  let index = 0;
  while (index < text.length && isAlpha(text[index])) index += 1;
  if (index === 0 || index === text.length) return false;
  while (index < text.length) {
    if (!isDigit(text[index])) return false;
    index += 1;
  }
  return true;
};

const normalizeCellId = (text: string): CellId => text.toUpperCase();

const parsePrimary = (cursor: Cursor): Node => {
  const head = consume(cursor);
  if (!head) throw new Error('unexpected end of input');
  if (head.type === 'number') {
    return { kind: 'num', value: head.value };
  }
  if (head.type === 'punct' && head.value === '(') {
    const inner = parseExpr(cursor);
    if (!matchPunct(cursor, ')')) {
      throw new Error('missing closing paren');
    }
    return inner;
  }
  if (head.type === 'ident') {
    // Function call?
    if (matchPunct(cursor, '(')) {
      const args: Node[] = [];
      if (!matchPunct(cursor, ')')) {
        args.push(parseArg(cursor));
        while (matchPunct(cursor, ',')) {
          args.push(parseArg(cursor));
        }
        if (!matchPunct(cursor, ')')) {
          throw new Error('missing closing paren in call');
        }
      }
      return { kind: 'call', name: head.value.toUpperCase(), args };
    }
    if (!looksLikeCellId(head.value)) {
      throw new Error(`unknown identifier: ${head.value}`);
    }
    const fromId = normalizeCellId(head.value);
    if (matchPunct(cursor, ':')) {
      const next = consume(cursor);
      if (!next || next.type !== 'ident' || !looksLikeCellId(next.value)) {
        throw new Error('expected cell id after `:`');
      }
      return { kind: 'range', from: fromId, to: normalizeCellId(next.value) };
    }
    return { kind: 'cell', id: fromId };
  }
  throw new Error(`unexpected token: ${head.value}`);
};

const parseArg = (cursor: Cursor): Node => {
  // A bare range only makes sense inside a function call. Try range
  // first, fall back to a general expression otherwise.
  const head = peek(cursor);
  const colon = cursor.tokens[cursor.pos + 1];
  if (
    head?.type === 'ident' &&
    looksLikeCellId(head.value) &&
    colon?.type === 'punct' &&
    colon.value === ':'
  ) {
    cursor.pos += 2;
    const tail = consume(cursor);
    if (!tail || tail.type !== 'ident' || !looksLikeCellId(tail.value)) {
      throw new Error('expected cell id after `:`');
    }
    return {
      kind: 'range',
      from: normalizeCellId(head.value),
      to: normalizeCellId(tail.value),
    };
  }
  return parseExpr(cursor);
};

const splitCellId = (id: CellId): { column: string; row: number } | null => {
  let index = 0;
  while (index < id.length && isAlpha(id[index])) index += 1;
  if (index === 0 || index === id.length) return null;
  const row = Number.parseInt(id.slice(index), 10);
  if (!Number.isFinite(row)) return null;
  return { column: id.slice(0, index).toUpperCase(), row };
};

const expandRange = (from: CellId, to: CellId): CellId[] => {
  const start = splitCellId(from);
  const end = splitCellId(to);
  if (!start || !end) return [];
  const colA = start.column.charCodeAt(0);
  const colB = end.column.charCodeAt(0);
  const colLo = Math.min(colA, colB);
  const colHi = Math.max(colA, colB);
  const rowLo = Math.min(start.row, end.row);
  const rowHi = Math.max(start.row, end.row);
  const ids: CellId[] = [];
  for (let col = colLo; col <= colHi; col += 1) {
    for (let row = rowLo; row <= rowHi; row += 1) {
      ids.push(`${String.fromCharCode(col)}${row}`);
    }
  }
  return ids;
};

/**
 * Coerce a raw cell string to a number. Empty / non-numeric text reads
 * as 0 — matches the conventional spreadsheet behavior so that text
 * labels don't poison numeric formulas.
 */
const coerceLiteral = (raw: string | undefined): number => {
  if (raw === undefined || raw === '') return 0;
  const numeric = Number.parseFloat(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

/**
 * Evaluate a cell. `seen` carries the active dependency chain so cycle
 * detection short-circuits before the stack blows up.
 */
export const evaluateCell = (
  cells: CellMap,
  id: CellId,
  seen: ReadonlySet<CellId> = new Set(),
): CellValue => {
  if (seen.has(id)) {
    return { kind: 'error', reason: '#CYCLE' };
  }
  const raw = cells[id];
  if (raw === undefined || raw === '') {
    return { kind: 'empty' };
  }
  if (!raw.startsWith('=')) {
    const numeric = Number.parseFloat(raw);
    if (Number.isFinite(numeric) && /^-?\d*(\.\d+)?$/.test(raw.trim())) {
      return { kind: 'number', value: numeric };
    }
    return { kind: 'text', value: raw };
  }
  try {
    const tokens = tokenize(raw.slice(1));
    const cursor: Cursor = { tokens, pos: 0 };
    const tree = parseExpr(cursor);
    if (cursor.pos !== tokens.length) {
      return { kind: 'error', reason: '#PARSE' };
    }
    const next = new Set(seen);
    next.add(id);
    const result = evaluateNode(tree, cells, next);
    if (Number.isNaN(result)) {
      return { kind: 'error', reason: '#NAN' };
    }
    return { kind: 'number', value: result };
  } catch (error) {
    return {
      kind: 'error',
      reason: error instanceof Error ? `#${error.message}` : '#ERR',
    };
  }
};

const evaluateRef = (
  id: CellId,
  cells: CellMap,
  seen: ReadonlySet<CellId>,
): number => {
  if (seen.has(id)) throw new Error('CYCLE');
  const raw = cells[id];
  if (raw === undefined || raw === '') return 0;
  if (!raw.startsWith('=')) return coerceLiteral(raw);
  const tokens = tokenize(raw.slice(1));
  const cursor: Cursor = { tokens, pos: 0 };
  const tree = parseExpr(cursor);
  if (cursor.pos !== tokens.length) throw new Error('PARSE');
  const next = new Set(seen);
  next.add(id);
  return evaluateNode(tree, cells, next);
};

const collectNumbers = (
  node: Node,
  cells: CellMap,
  seen: ReadonlySet<CellId>,
): number[] => {
  if (node.kind === 'range') {
    return expandRange(node.from, node.to).map((id) =>
      evaluateRef(id, cells, seen),
    );
  }
  return [evaluateNode(node, cells, seen)];
};

const evaluateBinary = (
  node: { op: '+' | '-' | '*' | '/'; left: Node; right: Node },
  cells: CellMap,
  seen: ReadonlySet<CellId>,
): number => {
  const left = evaluateNode(node.left, cells, seen);
  const right = evaluateNode(node.right, cells, seen);
  switch (node.op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) throw new Error('DIV0');
      return left / right;
  }
};

const evaluateNode = (
  node: Node,
  cells: CellMap,
  seen: ReadonlySet<CellId>,
): number => {
  switch (node.kind) {
    case 'num':
      return node.value;
    case 'cell':
      return evaluateRef(node.id, cells, seen);
    case 'range':
      throw new Error('RANGE');
    case 'neg':
      return -evaluateNode(node.value, cells, seen);
    case 'bin':
      return evaluateBinary(node, cells, seen);
    case 'call': {
      const values = node.args.flatMap((arg) =>
        collectNumbers(arg, cells, seen),
      );
      switch (node.name) {
        case 'SUM':
          return values.reduce((acc, value) => acc + value, 0);
        case 'AVG':
        case 'AVERAGE':
          if (values.length === 0) return 0;
          return values.reduce((acc, value) => acc + value, 0) / values.length;
        case 'MIN':
          if (values.length === 0) return 0;
          return Math.min(...values);
        case 'MAX':
          if (values.length === 0) return 0;
          return Math.max(...values);
        case 'COUNT':
          return values.length;
        default:
          throw new Error(`FN:${node.name}`);
      }
    }
  }
};

/** Render a cell's evaluated value for display. */
export const formatCellValue = (value: CellValue): string => {
  switch (value.kind) {
    case 'empty':
      return '';
    case 'text':
      return value.value;
    case 'error':
      return value.reason;
    case 'number':
      return formatNumber(value.value);
  }
};

const formatNumber = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  // Trim long decimals while staying readable.
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
};

/** Numeric value or `null` if the cell isn't a number. Used by the chart. */
export const numericValue = (value: CellValue): number | null => {
  return value.kind === 'number' ? value.value : null;
};
