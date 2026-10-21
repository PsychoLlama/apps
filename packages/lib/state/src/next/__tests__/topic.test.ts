import { createComputed, createRoot, createSignal } from 'solid-js';
import { collect, pipe } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { defineTopic, subscribe, type Publish } from '../topic';

// Subscriptions that yield nothing.
const none = () => {};

describe('defineTopic', () => {
  it('delivers events to every subscriber', async () => {
    const $send = defineTopic<[a: number, b: string]>();
    const first = vi.fn<(num: number, str: string) => void>();
    const second = vi.fn<(num: number, str: string) => void>();
    await using effects = createTestController();
    const send = await effects.run($send);
    await effects.run(
      pipe([
        $send,
        subscribe(() => (num: number, str: string) => first(num, str), none),
      ]),
    );
    await effects.run(
      pipe([
        $send,
        subscribe(() => (num: number, str: string) => second(num, str), none),
      ]),
    );

    send(1, 'one');

    expect(first).toHaveBeenCalledWith(1, 'one');
    expect(second).toHaveBeenCalledWith(1, 'one');
  });

  it('hands subscribers whatever else upstream yields', async () => {
    const $send = defineTopic<[value: number]>();
    const $label = pipe([() => 'label']);
    const subscriber = vi.fn();
    await using effects = createTestController();
    const send = await effects.run($send);
    await effects.run(
      collect(
        [$send, $label],
        subscribe(
          (label: string) => (value: number) => {
            subscriber(value, label);
          },
          none,
        ),
      ),
    );

    send(1);

    expect(subscriber).toHaveBeenCalledWith(1, 'label');
  });

  it('stops delivering once released', async () => {
    const $send = defineTopic<[]>();
    const subscriber = vi.fn();
    const effects = createTestController();
    const send = await effects.run($send);
    await effects.run(pipe([$send, subscribe(() => subscriber, none)]));

    await effects[Symbol.asyncDispose]();
    send();

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('yields what the subscription selects', async () => {
    const $send = defineTopic<[]>();
    await using effects = createTestController();
    const send = await effects.run($send);
    const selected = await effects.run(
      pipe([
        $send,
        subscribe(
          () => () => {},
          (publish) => publish,
        ),
      ]),
    );

    expect(selected).toBe(send);
  });

  it('closes the channel once released', async () => {
    const effects = createTestController();
    const send = await effects.run(defineTopic<[]>());
    await effects[Symbol.asyncDispose]();

    expect(() => subscribe(() => () => {}, none)(send)).toThrow(
      'Not a topic publisher.',
    );
  });

  it('batches every subscriber into one update', async () => {
    const $send = defineTopic<[value: number]>();
    const [first, setFirst] = createSignal(0);
    const [second, setSecond] = createSignal(0);
    await using effects = createTestController();
    const send = await effects.run($send);
    await effects.run(
      pipe([$send, subscribe(() => (value: number) => setFirst(value), none)]),
    );
    await effects.run(
      pipe([$send, subscribe(() => (value: number) => setSecond(value), none)]),
    );

    const seen: number[][] = [];
    const dispose = createRoot((dispose) => {
      createComputed(() => seen.push([first(), second()]));
      return dispose;
    });

    send(1);
    dispose();

    expect(seen).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });

  it('keeps subscriber reads out of the emitter’s scope', async () => {
    const $send = defineTopic<[]>();
    const [count, setCount] = createSignal(0);
    await using effects = createTestController();
    const send = await effects.run($send);
    await effects.run(pipe([$send, subscribe(() => () => count(), none)]));

    let runs = 0;
    const dispose = createRoot((dispose) => {
      createComputed(() => {
        runs += 1;
        send();
      });
      return dispose;
    });

    setCount(1);
    dispose();

    expect(runs).toBe(1);
  });

  it('shares one publisher per controller', async () => {
    const $send = defineTopic<[]>();
    await using effects = createTestController();
    await using other = createTestController();

    const send = await effects.run($send);
    const again = await effects.run($send);
    const elsewhere = await other.run($send);

    expect(again).toBe(send);
    expect(elsewhere).not.toBe(send);
  });

  it('keeps separate topics apart', async () => {
    const $first = defineTopic<[]>();
    const $second = defineTopic<[]>();
    const subscriber = vi.fn();
    await using effects = createTestController();
    const second = await effects.run($second);
    await effects.run(pipe([$first, subscribe(() => subscriber, none)]));

    second();

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('refuses functions that are not publishers', () => {
    const impostor = (() => {}) as Publish<[]>;

    expect(() => subscribe(() => () => {}, none)(impostor)).toThrow(
      'Not a topic publisher.',
    );
  });
});
