import {
  contextErrors,
  flattenAttributes,
  hasAttributes,
} from '../log-context';

describe('flattenAttributes', () => {
  it('dots its way down through objects', () => {
    expect(
      flattenAttributes({ viewport: { width: 2090, dpr: { x: 2 } } }),
    ).toEqual([
      { key: 'viewport.width', value: 2090 },
      { key: 'viewport.dpr.x', value: 2 },
    ]);
  });

  it('keeps arrays whole, objects inside them included', () => {
    expect(flattenAttributes({ peers: [{ id: 1 }] })).toEqual([
      { key: 'peers', value: [{ id: 1 }] },
    ]);
  });

  it('keeps an empty object as a leaf', () => {
    expect(flattenAttributes({ empty: {} })).toEqual([
      { key: 'empty', value: {} },
    ]);
  });

  it('drops undefined values and top-level errors', () => {
    expect(
      flattenAttributes({
        error: new Error('boom'),
        missing: undefined,
        note: '',
      }),
    ).toEqual([{ key: 'note', value: '' }]);
  });
});

describe('hasAttributes', () => {
  it('ignores errors and undefined values', () => {
    expect(
      hasAttributes({ error: new Error('boom'), missing: undefined }),
    ).toBe(false);
  });

  it('counts anything else', () => {
    expect(hasAttributes({ parent: null })).toBe(true);
  });
});

describe('contextErrors', () => {
  it('collects every top-level error', () => {
    const error = new Error('boom');
    const other = new TypeError('fetch');

    expect(contextErrors({ error, attempt: 3, other })).toEqual([error, other]);
  });
});
