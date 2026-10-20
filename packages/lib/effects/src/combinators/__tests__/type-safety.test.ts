import type { Accessor } from 'solid-js';
import type { Plan } from '../../plan';
import {
  reactive,
  resource,
  type Collected,
  type Reactive,
  type Resource,
} from '../../task';
import { collect } from '../collect';
import { pipe } from '../pipe';

const constraints = () => ({ audio: true, video: true });
const getStream = async (opts: { audio: boolean; video: boolean }) =>
  resource(`stream:${opts.audio}`, () => {});
const getTrack = (kind: 'audio' | 'video') => (stream: string) =>
  `${stream}:${kind}`;
const observe = (track: string) => resource(track.length, () => {});

describe('type safety', () => {
  it('infers a pipeline from its first and last steps', () => {
    const plan = pipe([constraints, getStream, getTrack('audio'), observe]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<[], [Resource<number, 'sync'>], 'async'>
    >();
  });

  it('keeps the first step’s parameters as the plan’s inputs', () => {
    const plan = pipe([getTrack('audio'), observe]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<[stream: string], [Resource<number, 'sync'>], 'sync'>
    >();
  });

  it('unwraps promises and resources between steps', () => {
    const plan = pipe([getStream, (stream: string) => stream.length]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<[opts: { audio: boolean; video: boolean }], [number], 'async'>
    >();
  });

  it('passes reactive outputs as accessors', () => {
    const muted = (track: string) => reactive(() => track.length > 0);
    const plan = pipe([getTrack('audio'), muted]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<[stream: string], [Reactive<boolean, 'sync'>], 'sync'>
    >();

    pipe([muted, (state: Accessor<boolean>) => state()]);
    const illegal = () => {
      // @ts-expect-error — downstream gets the accessor, not the value
      pipe([muted, (state: boolean) => state]);
    };
    void illegal;
  });

  it('collects branches into one array', () => {
    const grouped = collect([
      collect([() => 0, () => 1]),
      collect([() => 'a', () => 'b']),
    ]);

    expectTypeOf(grouped).toEqualTypeOf<
      Plan<
        [],
        [Collected<[Collected<[number, number]>, Collected<[string, string]>]>],
        'sync'
      >
    >();

    const plan = pipe([
      grouped,
      ([numbers, strings]: [[number, number], [string, string]]) =>
        [...numbers, ...strings] as const,
    ]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<[], [readonly [number, number, string, string]], 'sync'>
    >();
  });

  it('accepts plans anywhere a task fits', () => {
    const inner = pipe([getTrack('audio'), observe]);
    const plan = pipe([() => 'stream', collect([inner, inner])]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<
        [],
        [Collected<[Resource<number, 'sync'>, Resource<number, 'sync'>]>],
        'sync'
      >
    >();
  });

  it('keeps wrappers inside collected outputs, and yields through them', () => {
    const muted = () => reactive(() => true);
    const both = collect([observe, muted]);
    expectTypeOf(both).toEqualTypeOf<
      Plan<
        [track: string],
        [Collected<[Resource<number, 'sync'>, Reactive<boolean, 'sync'>]>],
        'sync'
      >
    >();

    pipe([both, (values: [number, Accessor<boolean>]) => values]);
    const illegal = () => {
      // @ts-expect-error — downstream gets yielded values, not wrappers
      pipe([both, (values: [Resource<number>, boolean]) => values]);
    };
    void illegal;
  });

  it('types a collecting function from its branches', () => {
    const plan = collect(
      [getTrack('audio'), getTrack('video'), observe],
      (audio, video, length) => {
        expectTypeOf(audio).toEqualTypeOf<string>();
        expectTypeOf(video).toEqualTypeOf<string>();
        expectTypeOf(length).toEqualTypeOf<number>();
        return { audio, video, length };
      },
    );

    expectTypeOf(plan).toEqualTypeOf<
      Plan<
        [stream: string],
        [{ audio: string; video: string; length: number }],
        'sync'
      >
    >();
  });

  it('yields through wrappers on both sides of a collecting function', () => {
    const muted = () => reactive(() => true);
    const plan = collect([() => 'stream', muted], (stream, state) => {
      expectTypeOf(state).toEqualTypeOf<Accessor<boolean>>();
      return resource(stream.length, () => {});
    });

    expectTypeOf(plan).toEqualTypeOf<
      Plan<[], [Resource<number, 'sync'>], 'sync'>
    >();
    expectTypeOf(pipe([plan, (length: number) => length])).toEqualTypeOf<
      Plan<[], [number], 'sync'>
    >();
  });

  it('takes the mode of a collecting function', () => {
    const later = pipe([async () => 1]);

    expectTypeOf(collect([() => 0], async (count) => count)).toEqualTypeOf<
      Plan<[], [number], 'async'>
    >();
    expectTypeOf(
      collect([() => 0], (count) => resource(count, async () => {})),
    ).toEqualTypeOf<Plan<[], [Resource<number, 'async'>], 'async'>>();
    expectTypeOf(collect([later], (count) => count)).toEqualTypeOf<
      Plan<[], [number], 'async'>
    >();
  });

  it('rejects collecting functions that disagree with the branches', () => {
    const illegal = () => {
      // @ts-expect-error — the branch yields a string
      collect([() => 'a'], (count: number) => count);

      // @ts-expect-error — more parameters than branches
      collect([() => 'a'], (left: string, right: string) => left + right);
    };
    void illegal;
  });

  it('is synchronous when every step is', () => {
    const plan = pipe([() => 1, (count: number) => resource(count, () => {})]);
    expectTypeOf(plan).toEqualTypeOf<
      Plan<[], [Resource<number, 'sync'>], 'sync'>
    >();
  });

  it('is asynchronous when any task may return a promise', () => {
    const later = async (count: number) => count;
    const maybe = (count: number) => (count ? count : Promise.resolve(count));

    expectTypeOf(pipe([() => 1, later])).toEqualTypeOf<
      Plan<[], [number], 'async'>
    >();
    expectTypeOf(pipe([() => 1, maybe])).toEqualTypeOf<
      Plan<[], [number], 'async'>
    >();
  });

  it('is asynchronous when any cleanup may return a promise', () => {
    const open = () => resource(1, async () => {});
    const live = () =>
      reactive(
        () => 1,
        async () => {},
      );

    expectTypeOf(pipe([open])).toEqualTypeOf<
      Plan<[], [Resource<number, 'async'>], 'async'>
    >();
    expectTypeOf(pipe([live])).toEqualTypeOf<
      Plan<[], [Reactive<number, 'async'>], 'async'>
    >();
  });

  it('treats untyped results as asynchronous', () => {
    const untyped = (): unknown => 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Under test.
    const loose = (): any => 1;

    expectTypeOf(pipe([untyped])).toEqualTypeOf<Plan<[], [unknown], 'async'>>();
    expectTypeOf(pipe([loose])).toEqualTypeOf<
      Plan<[], [ReturnType<typeof loose>], 'async'>
    >();
  });

  it('carries an asynchronous step through every combinator', () => {
    const later = pipe([async () => 1]);

    expectTypeOf(
      collect([() => 0, later], (zero, one) => zero + one),
    ).toEqualTypeOf<Plan<[], [number], 'async'>>();
    expectTypeOf(
      pipe([() => 0, pipe([(count: number) => count])]),
    ).toEqualTypeOf<Plan<[], [number], 'sync'>>();
    expectTypeOf(pipe([later, (count: number) => count])).toEqualTypeOf<
      Plan<[], [number], 'async'>
    >();
    expectTypeOf(collect([() => 0, later])).toEqualTypeOf<
      Plan<[], [Collected<[number, number]>], 'async'>
    >();
  });

  it('keeps asynchronous plans out of synchronous slots', () => {
    const later = pipe([async () => 1]);
    const now = pipe([() => 1]);

    expectTypeOf(now).toExtend<Plan<[], [number], 'sync'>>();
    expectTypeOf(later).not.toExtend<Plan<[], [number], 'sync'>>();
    expectTypeOf(later).toExtend<Plan<[], [number]>>();
  });

  it('rejects mismatched steps', () => {
    const illegal = () => {
      // @ts-expect-error — `getStream` wants constraints, not a number
      pipe([() => 1, getStream]);

      // @ts-expect-error — a sub-plan’s inputs must match too
      pipe([() => 1, pipe([getTrack('audio')])]);

      // @ts-expect-error — branches must accept the same inputs
      collect([getTrack('audio'), (count: number) => count]);

      // @ts-expect-error — pipelines can't be empty
      pipe([]);
    };
    void illegal;
  });

  it('requires inline steps to annotate their parameters', () => {
    const illegal = () => {
      // @ts-expect-error — no contextual typing across positions
      pipe([() => 1, (one) => void one]);
    };
    void illegal;
  });
});
