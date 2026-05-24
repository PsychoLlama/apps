import { evaluateCell, formatCellValue, numericValue } from '../formula';
import type { CellMap } from '../store';

const sheet = (overrides: CellMap = {}): CellMap => ({ ...overrides });

describe('evaluateCell', () => {
  it('returns empty for unset cells', () => {
    expect(evaluateCell(sheet(), 'A1')).toEqual({ kind: 'empty' });
  });

  it('parses bare numbers as numeric', () => {
    expect(evaluateCell(sheet({ A1: '42' }), 'A1')).toEqual({
      kind: 'number',
      value: 42,
    });
  });

  it('parses negative decimals', () => {
    expect(evaluateCell(sheet({ A1: '-3.5' }), 'A1')).toEqual({
      kind: 'number',
      value: -3.5,
    });
  });

  it('treats non-numeric literals as text', () => {
    expect(evaluateCell(sheet({ A1: 'Total' }), 'A1')).toEqual({
      kind: 'text',
      value: 'Total',
    });
  });

  it('evaluates arithmetic with precedence', () => {
    expect(evaluateCell(sheet({ A1: '=2+3*4' }), 'A1')).toEqual({
      kind: 'number',
      value: 14,
    });
  });

  it('respects parentheses', () => {
    expect(evaluateCell(sheet({ A1: '=(2+3)*4' }), 'A1')).toEqual({
      kind: 'number',
      value: 20,
    });
  });

  it('resolves cell references', () => {
    const cells = sheet({ A1: '10', B1: '=A1+5' });
    expect(evaluateCell(cells, 'B1')).toEqual({ kind: 'number', value: 15 });
  });

  it('treats text refs as zero in numeric context', () => {
    const cells = sheet({ A1: 'Label', B1: '=A1+5' });
    expect(evaluateCell(cells, 'B1')).toEqual({ kind: 'number', value: 5 });
  });

  it('treats numeric-prefixed text as zero, not a partial parse', () => {
    // `parseFloat("1foo")` returns 1; we want strict whole-string
    // numeric matching so refs to text don't silently coerce.
    const cells = sheet({ A1: '1foo', B1: '=A1+5' });
    expect(evaluateCell(cells, 'A1')).toEqual({ kind: 'text', value: '1foo' });
    expect(evaluateCell(cells, 'B1')).toEqual({ kind: 'number', value: 5 });
  });

  it('accepts a leading decimal point', () => {
    expect(evaluateCell(sheet({ A1: '.5' }), 'A1')).toEqual({
      kind: 'number',
      value: 0.5,
    });
  });

  it('detects direct cycles', () => {
    const cells = sheet({ A1: '=A1+1' });
    expect(evaluateCell(cells, 'A1')).toEqual({
      kind: 'error',
      reason: '#CYCLE',
    });
  });

  it('detects indirect cycles', () => {
    const cells = sheet({ A1: '=B1', B1: '=A1' });
    expect(evaluateCell(cells, 'A1')).toEqual({
      kind: 'error',
      reason: '#CYCLE',
    });
  });

  it('reports parse errors', () => {
    expect(evaluateCell(sheet({ A1: '=1++' }), 'A1').kind).toBe('error');
  });

  it('reports division by zero', () => {
    expect(evaluateCell(sheet({ A1: '=1/0' }), 'A1')).toEqual({
      kind: 'error',
      reason: '#DIV0',
    });
  });

  describe('functions', () => {
    it('sums a range', () => {
      const cells = sheet({ A1: '1', A2: '2', A3: '3', B1: '=SUM(A1:A3)' });
      expect(evaluateCell(cells, 'B1')).toEqual({
        kind: 'number',
        value: 6,
      });
    });

    it('averages a range', () => {
      const cells = sheet({ A1: '2', A2: '4', A3: '6', B1: '=AVG(A1:A3)' });
      expect(evaluateCell(cells, 'B1')).toEqual({
        kind: 'number',
        value: 4,
      });
    });

    it('finds min and max', () => {
      const cells = sheet({
        A1: '3',
        A2: '1',
        A3: '2',
        B1: '=MIN(A1:A3)',
        B2: '=MAX(A1:A3)',
      });
      expect(evaluateCell(cells, 'B1')).toEqual({
        kind: 'number',
        value: 1,
      });
      expect(evaluateCell(cells, 'B2')).toEqual({
        kind: 'number',
        value: 3,
      });
    });

    it('mixes ranges and scalars in args', () => {
      const cells = sheet({
        A1: '1',
        A2: '2',
        B1: '=SUM(A1:A2, 10)',
      });
      expect(evaluateCell(cells, 'B1')).toEqual({
        kind: 'number',
        value: 13,
      });
    });

    it('reports unknown functions', () => {
      expect(evaluateCell(sheet({ A1: '=BOGUS(1)' }), 'A1').kind).toBe('error');
    });
  });
});

describe('formatCellValue', () => {
  it('renders integers without trailing decimals', () => {
    expect(formatCellValue({ kind: 'number', value: 42 })).toBe('42');
  });

  it('trims trailing zeros on decimals', () => {
    expect(formatCellValue({ kind: 'number', value: 1.5 })).toBe('1.5');
  });

  it('renders empty for blank cells', () => {
    expect(formatCellValue({ kind: 'empty' })).toBe('');
  });

  it('forwards error reasons', () => {
    expect(formatCellValue({ kind: 'error', reason: '#OOPS' })).toBe('#OOPS');
  });
});

describe('numericValue', () => {
  it('returns the value for numeric results', () => {
    expect(numericValue({ kind: 'number', value: 7 })).toBe(7);
  });

  it('returns null for non-numeric results', () => {
    expect(numericValue({ kind: 'empty' })).toBeNull();
    expect(numericValue({ kind: 'text', value: 'x' })).toBeNull();
    expect(numericValue({ kind: 'error', reason: '#X' })).toBeNull();
  });
});
