import { createContext } from '../config';
import { createSpan } from '../span';

const setup = () =>
  createContext({
    getCurrentTime: () => 1_000,
    processor: vi.fn(),
    holz: { processor: vi.fn() },
  });

describe('span.child', () => {
  it('creates a span with the given name', () => {
    const child = createSpan('load-page', setup()).child('fetch-config');

    expect(child.name).toBe('fetch-config');
  });

  it('passes each child to the processor', () => {
    const context = setup();
    const child = createSpan('load-page', context).child('fetch-config');

    expect(context.processor).toHaveBeenLastCalledWith(child);
  });

  it('supports nesting beyond one level', () => {
    const grandchild = createSpan('a', setup()).child('b').child('c');

    expect(grandchild.name).toBe('c');
  });
});
