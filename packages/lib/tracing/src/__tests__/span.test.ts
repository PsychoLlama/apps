import { createLogger } from '@holz/core';

import { createSpan } from '../span';

const createContext = () => ({
  log: createLogger(vi.fn()),
  processor: vi.fn(),
});

describe('span.child', () => {
  it('creates a span with the given name', () => {
    const child = createSpan('load-page', createContext()).child(
      'fetch-config',
    );

    expect(child.name).toBe('fetch-config');
  });

  it('passes each child to the processor', () => {
    const context = createContext();
    const child = createSpan('load-page', context).child('fetch-config');

    expect(context.processor).toHaveBeenLastCalledWith(child);
  });

  it('supports nesting beyond one level', () => {
    const grandchild = createSpan('a', createContext()).child('b').child('c');

    expect(grandchild.name).toBe('c');
  });
});
