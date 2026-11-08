import { createContext } from '../config';
import { createSpan } from '../span';

const setup = () =>
  createContext({
    getCurrentTime: () => 1_000,
    processor: vi.fn(),
    holz: { processor: vi.fn() },
  });

describe('span.child', () => {
  it('passes each child to the processor', () => {
    const context = setup();
    const child = createSpan('load-page', context).child('fetch-config');

    expect(context.processor).toHaveBeenLastCalledWith(child);
  });

  it('supports nesting beyond one level', () => {
    const context = setup();

    createSpan('a', context).child('b').child('c');

    expect(context.processor).toHaveBeenCalledTimes(3);
  });
});
