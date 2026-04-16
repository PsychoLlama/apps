import { defineTopic } from '../topic';
import { createEventBus, publish } from '../event-bus';
import { defineStore } from '../store';

const increment = defineTopic();
const add = defineTopic<number>();
const reset = defineTopic();

function createCounter(eventBus = createEventBus()) {
  const createStore = defineStore<{ count: number }>(
    () => ({ count: 0 }),
    (on) => {
      on(increment, (state) => {
        state.count += 1;
      });

      on(add, (state, amount) => {
        state.count += amount;
      });

      on(reset, (state) => {
        state.count = 0;
      });
    },
  );

  const [state, dispose] = createStore(eventBus);
  return { state, dispose, eventBus };
}

describe('defineStore', () => {
  it('initializes with the provided state', () => {
    const { state } = createCounter();
    expect(state.count).toBe(0);
  });

  it('updates state in response to topics', () => {
    const { state, eventBus } = createCounter();

    publish(eventBus, increment);
    expect(state.count).toBe(1);
  });

  it('passes topic payload to handlers', () => {
    const { state, eventBus } = createCounter();

    publish(eventBus, add, 10);
    expect(state.count).toBe(10);
  });

  it('handles multiple topics on the same store', () => {
    const { state, eventBus } = createCounter();

    publish(eventBus, increment);
    publish(eventBus, increment);
    publish(eventBus, add, 5);
    expect(state.count).toBe(7);

    publish(eventBus, reset);
    expect(state.count).toBe(0);
  });

  it('isolates store instances across buses', () => {
    const busA = createEventBus();
    const busB = createEventBus();
    const { state: a } = createCounter(busA);
    const { state: b } = createCounter(busB);

    publish(busA, increment);

    expect(a.count).toBe(1);
    expect(b.count).toBe(0);
  });

  it('stops handling topics after dispose', () => {
    const { state, dispose, eventBus } = createCounter();

    publish(eventBus, increment);
    expect(state.count).toBe(1);

    dispose();

    publish(eventBus, increment);
    expect(state.count).toBe(1);
  });

  it('is safe to dispose twice', () => {
    const { dispose } = createCounter();

    dispose();
    expect(() => dispose()).not.toThrow();
  });

  it('throws on duplicate handlers for the same topic', () => {
    const topic = defineTopic();
    const create = defineStore<{ count: number }>(
      () => ({ count: 0 }),
      (on) => {
        on(topic, (state) => {
          state.count += 1;
        });
        on(topic, (state) => {
          state.count += 2;
        });
      },
    );

    expect(() => create()).toThrow('Duplicate handler');
  });

  it('creates independent instances from the same definition', () => {
    const create = defineStore<{ count: number }>(
      () => ({ count: 0 }),
      (on) => {
        on(increment, (state) => {
          state.count += 1;
        });
      },
    );

    const busA = createEventBus();
    const busB = createEventBus();
    const [a] = create(busA);
    const [b] = create(busB);

    publish(busA, increment);

    expect(a.count).toBe(1);
    expect(b.count).toBe(0);
  });
});
