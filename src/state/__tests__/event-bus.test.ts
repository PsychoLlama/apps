import { defineTopic } from '../topic';
import { createEventBus, publish, subscribe } from '../event-bus';

describe('publish', () => {
  it('does nothing when publishing with no subscribers', () => {
    const eventBus = createEventBus();
    const topic = defineTopic();

    expect(() => publish(eventBus, topic)).not.toThrow();
  });
});

describe('subscribe', () => {
  it('calls handler with the topic and payload', () => {
    const eventBus = createEventBus();
    const topic = defineTopic<string>();
    const handler = vi.fn();

    subscribe(eventBus, [topic], handler);
    publish(eventBus, topic, 'hello');

    expect(handler).toHaveBeenCalledWith(topic, 'hello');
  });

  it('supports void topics', () => {
    const eventBus = createEventBus();
    const topic = defineTopic();
    const handler = vi.fn();

    subscribe(eventBus, [topic], handler);
    publish(eventBus, topic);

    expect(handler).toHaveBeenCalledWith(topic, undefined);
  });

  it('publishes to multiple subscribers', () => {
    const eventBus = createEventBus();
    const topic = defineTopic<number>();
    const a = vi.fn();
    const b = vi.fn();

    subscribe(eventBus, [topic], a);
    subscribe(eventBus, [topic], b);
    publish(eventBus, topic, 42);

    expect(a).toHaveBeenCalledWith(topic, 42);
    expect(b).toHaveBeenCalledWith(topic, 42);
  });

  it('fires from any subscribed topic', () => {
    const eventBus = createEventBus();
    const a = defineTopic();
    const b = defineTopic();
    const handler = vi.fn();

    subscribe(eventBus, [a, b], handler);
    publish(eventBus, a);
    publish(eventBus, b);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(a, undefined);
    expect(handler).toHaveBeenCalledWith(b, undefined);
  });

  it('does not fire for topics not in the set', () => {
    const eventBus = createEventBus();
    const a = defineTopic();
    const b = defineTopic();
    const handler = vi.fn();

    subscribe(eventBus, [a], handler);
    publish(eventBus, b);

    expect(handler).not.toHaveBeenCalled();
  });

  it('unsubscribes from all topics at once', () => {
    const eventBus = createEventBus();
    const a = defineTopic();
    const b = defineTopic();
    const handler = vi.fn();

    const unsub = subscribe(eventBus, [a, b], handler);
    unsub();

    publish(eventBus, a);
    publish(eventBus, b);

    expect(handler).not.toHaveBeenCalled();
  });

  it('retains other subscribers when one unsubscribes', () => {
    const eventBus = createEventBus();
    const topic = defineTopic();
    const remaining = vi.fn();

    subscribe(eventBus, [topic], vi.fn());
    const unsub = subscribe(eventBus, [topic], vi.fn());
    subscribe(eventBus, [topic], remaining);

    unsub();
    publish(eventBus, topic);

    expect(remaining).toHaveBeenCalledTimes(1);
  });
});
