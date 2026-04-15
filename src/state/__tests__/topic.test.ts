import { defineTopic } from '../topic';

describe('defineTopic', () => {
  it('returns a symbol', () => {
    const topic = defineTopic();
    expect(typeof topic).toBe('symbol');
  });

  it('returns unique symbols', () => {
    const a = defineTopic();
    const b = defineTopic();
    expect(a).not.toBe(b);
  });
});
