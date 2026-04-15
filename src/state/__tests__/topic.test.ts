import { createEventBus, subscribe } from '../event-bus';
import { defineTopic, useTopic } from '../topic';

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

describe('useTopic', () => {
  it('returns a function that publishes to the bus', () => {
    const eventBus = createEventBus();
    const topic = defineTopic<string>();
    const handler = vi.fn();

    subscribe(eventBus, [topic], handler);
    const send = useTopic(topic, eventBus);
    send('hello');

    expect(handler).toHaveBeenCalledWith(topic, 'hello');
  });

  it('supports void topics with no arguments', () => {
    const eventBus = createEventBus();
    const topic = defineTopic();
    const handler = vi.fn();

    subscribe(eventBus, [topic], handler);
    const fire = useTopic(topic, eventBus);
    fire();

    expect(handler).toHaveBeenCalledWith(topic, undefined);
  });
});

describe('useTopic type inference', () => {
  it('void topic returns () => void', () => {
    const topic = defineTopic();
    const fire = useTopic(topic, createEventBus());

    expectTypeOf(fire).toEqualTypeOf<() => void>();
  });

  it('typed topic returns (payload) => void', () => {
    const topic = defineTopic<number>();
    const send = useTopic(topic, createEventBus());

    expectTypeOf(send).toEqualTypeOf<(payload: number) => void>();
  });
});
