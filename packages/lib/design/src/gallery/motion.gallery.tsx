import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import { entrance, exit, standard } from '@lib/design';
import { durationValues } from '../tokens/motion.css';
import * as css from './motion.gallery.css';

// Render against the tokens' concrete literals (`durationValues`), not the public
// CSS-var tokens: under `prefers-reduced-motion` the vars collapse to `0ms`, which
// would make a gallery whose whole job is to demonstrate durations look broken.

/** Easing families, keyed by their x-axis title. */
const easingGroups = { standard, entrance, exit };

type DurationFamily = keyof typeof durationValues;
type DurationStep = 1 | 2;
type EasingFamily = keyof typeof easingGroups;
type EasingWeight = 'productive' | 'expressive';

/**
 * One animated cell, located by its grid coordinates rather than a resolved
 * token. The Durations section crosses a {@link DurationFamily} column with a
 * {@link DurationStep} row; Easings crosses an {@link EasingFamily} column with
 * an {@link EasingWeight} row. `render` reads whichever pair is present and looks
 * the token up — the value is a 2D lookup, so it can't ride in on a single axis.
 */
interface Motion {
  /** Durations column: the duration family. */
  durationFamily: DurationFamily;
  /** Durations row: the scale step within the family. */
  step: DurationStep;
  /** Easings column: the easing family. */
  easingFamily: EasingFamily;
  /** Easings row: productive vs. expressive weight. */
  weight: EasingWeight;
}

/** Duration families on the x-axis, fastest to slowest. */
const durationFamilies: ReadonlyArray<GalleryAxis<Motion>> = (
  Object.keys(durationValues) as ReadonlyArray<DurationFamily>
).map((family) => ({ title: family, props: { durationFamily: family } }));

/** Duration steps on the y-axis. */
const durationSteps: ReadonlyArray<GalleryAxis<Motion>> = (
  [1, 2] as ReadonlyArray<DurationStep>
).map((step) => ({ title: String(step), props: { step } }));

/** Easing families on the x-axis, grouped standard → entrance → exit. */
const easingFamilies: ReadonlyArray<GalleryAxis<Motion>> = (
  Object.keys(easingGroups) as ReadonlyArray<EasingFamily>
).map((family) => ({ title: family, props: { easingFamily: family } }));

/** Easing weights on the y-axis. */
const easingWeights: ReadonlyArray<GalleryAxis<Motion>> = (
  ['productive', 'expressive'] as ReadonlyArray<EasingWeight>
).map((weight) => ({ title: weight, props: { weight } }));

/** A long, fixed slide so the easing curve — not the speed — reads. */
const easeDuration = `calc(${durationValues.slow[2]} * 2)`;

// --- Shared duration clock ---
//
// Every duration swatch reads one signal so they flip in lockstep; each then
// transitions to the new state at its own token speed and holds until the next
// flip. A single timer drives the signal, ref-counted across the mounted
// swatches so it only runs while the section is on screen.

const [lit, setLit] = createSignal(false);

let timer: ReturnType<typeof setInterval> | undefined;
let mounted = 0;

/**
 * The shared clock's flip interval, in milliseconds: the slowest duration token
 * doubled for breathing room, so even the slowest swatch settles well before the
 * next flip. Parsed straight from the token literals (all in `ms`), so the period
 * tracks the tokens rather than a hard-coded constant.
 */
const periodMs =
  Math.max(
    ...Object.values(durationValues).flatMap((scale) =>
      Object.values(scale).map((value) => parseFloat(value)),
    ),
  ) * 2;

/** Start the shared clock on first mount. */
const startClock = (): void => {
  mounted += 1;
  if (timer) return;
  timer = setInterval(() => setLit((on) => !on), periodMs);
};

/** Stop the clock once the last swatch unmounts. */
const stopClock = (): void => {
  mounted -= 1;
  if (mounted === 0 && timer) {
    clearInterval(timer);
    timer = undefined;
  }
};

/** A duration swatch that eases to the shared lit state at its own token speed. */
const DurationSwatch = (props: { duration: string }) => {
  onMount(startClock);
  onCleanup(stopClock);
  return (
    <div
      class={css.swatch}
      classList={{ [css.swatchLit]: lit() }}
      style={assignInlineVars({ [css.durationVar]: props.duration })}
    />
  );
};

/**
 * Gallery listing for `@lib/design`'s motion tokens. Two views, each a grid of a
 * family (x-axis) against its scale (y-axis): durations pulse a swatch at
 * increasing speeds, easings slide a thumb along each curve at a shared,
 * deliberate pace.
 */
export default {
  title: 'Motion',
  render: (props) => (
    <Show
      when={props.easingFamily}
      fallback={
        <DurationSwatch
          duration={
            props.durationFamily && props.step
              ? durationValues[props.durationFamily][props.step]
              : ''
          }
        />
      }
    >
      {(family) => (
        <div
          class={css.track}
          style={assignInlineVars({
            [css.easingVar]: props.weight
              ? easingGroups[family()][props.weight]
              : undefined,
            [css.durationVar]: easeDuration,
          })}
        >
          <div class={css.thumb} />
        </div>
      )}
    </Show>
  ),
  sections: [
    {
      title: 'Durations',
      align: { rows: 'center', columns: 'center' },
      columns: durationFamilies,
      rows: durationSteps,
    },
    {
      title: 'Easings',
      align: { rows: 'center', columns: 'center' },
      columns: easingFamilies,
      rows: easingWeights,
    },
  ],
} satisfies GalleryListing<Motion>;
