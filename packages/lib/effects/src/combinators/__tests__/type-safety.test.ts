import type { Accessor } from 'solid-js';
import type { Flow } from '../../flow';
import { reactive, resource } from '../../task';
import { collect } from '../collect';
import { concurrent } from '../concurrent';
import { pipe } from '../pipe';

const constraints = () => ({ audio: true, video: true });
const getStream = async (opts: { audio: boolean; video: boolean }) =>
  resource(`stream:${opts.audio}`, () => {});
const getTrack = (kind: 'audio' | 'video') => (stream: string) =>
  `${stream}:${kind}`;
const observe = (track: string) => resource(track.length, () => {});

describe('type safety', () => {
  it('infers a pipeline from its first and last steps', () => {
    const flow = pipe([constraints, getStream, getTrack('audio'), observe]);
    expectTypeOf(flow).toEqualTypeOf<Flow<[], [number]>>();
  });

  it('keeps the first step’s parameters as the flow’s inputs', () => {
    const flow = pipe([getTrack('audio'), observe]);
    expectTypeOf(flow).toEqualTypeOf<Flow<[stream: string], [number]>>();
  });

  it('unwraps promises and resources between steps', () => {
    const flow = pipe([getStream, (stream: string) => stream.length]);
    expectTypeOf(flow).toEqualTypeOf<
      Flow<[opts: { audio: boolean; video: boolean }], [number]>
    >();
  });

  it('passes reactive outputs as accessors', () => {
    const muted = (track: string) => reactive(() => track.length > 0);
    const flow = pipe([getTrack('audio'), muted]);
    expectTypeOf(flow).toEqualTypeOf<
      Flow<[stream: string], [Accessor<boolean>]>
    >();

    pipe([muted, (state: Accessor<boolean>) => state()]);
    const illegal = () => {
      // @ts-expect-error — downstream gets the accessor, not the value
      pipe([muted, (state: boolean) => state]);
    };
    void illegal;
  });

  it('spreads concurrent outputs positionally', () => {
    const fan = concurrent([getTrack('audio'), getTrack('video')]);
    expectTypeOf(fan).toEqualTypeOf<Flow<[stream: string], [string, string]>>();

    const flow = pipe([
      () => 'stream',
      fan,
      (audio: string, video: string) => ({ audio, video }),
    ]);
    expectTypeOf(flow).toEqualTypeOf<
      Flow<[], [{ audio: string; video: string }]>
    >();
  });

  it('flattens nested concurrent outputs', () => {
    const nested = concurrent([
      concurrent([() => 0, () => 1]),
      concurrent([() => 'a', () => 'b']),
    ]);

    expectTypeOf(nested).toEqualTypeOf<
      Flow<[], [number, number, string, string]>
    >();
  });

  it('collects branches into one array', () => {
    const grouped = concurrent([
      collect([() => 0, () => 1]),
      collect([() => 'a', () => 'b']),
    ]);

    expectTypeOf(grouped).toEqualTypeOf<
      Flow<[], [[number, number], [string, string]]>
    >();

    const flow = pipe([
      grouped,
      (numbers: [number, number], strings: [string, string]) =>
        [...numbers, ...strings] as const,
    ]);
    expectTypeOf(flow).toEqualTypeOf<
      Flow<[], [readonly [number, number, string, string]]>
    >();
  });

  it('accepts flows anywhere a task fits', () => {
    const inner = pipe([getTrack('audio'), observe]);
    const flow = pipe([() => 'stream', concurrent([inner, inner])]);
    expectTypeOf(flow).toEqualTypeOf<Flow<[], [number, number]>>();
  });

  it('rejects mismatched steps', () => {
    const illegal = () => {
      // @ts-expect-error — `getStream` wants constraints, not a number
      pipe([() => 1, getStream]);

      // @ts-expect-error — a sub-flow’s inputs must match too
      pipe([() => 1, pipe([getTrack('audio')])]);

      // @ts-expect-error — branches must accept the same inputs
      concurrent([getTrack('audio'), (count: number) => count]);

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
