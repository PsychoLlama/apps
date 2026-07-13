import { defineTopic } from '../topic';

describe('defineTopic', () => {
  it('wraps a payload into an inert [topic, payload] fact', () => {
    const renamed = defineTopic<string>();
    expect(renamed('value')).toEqual([renamed, 'value']);
  });

  it('produces zero-arg facts for payload-less topics', () => {
    const fired = defineTopic();
    expect(fired()).toEqual([fired, undefined]);
  });

  it('compares facts by topic identity and payload', () => {
    const first = defineTopic<number>();
    const second = defineTopic<number>();

    expect(first(1)).toEqual(first(1));
    expect(first(1)).not.toEqual(second(1));
    expect(first(1)).not.toEqual(first(2));
  });
});
