import { Show } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import { entrance, exit, fast, moderate, slow, standard } from '@lib/design';
import * as css from './motion.gallery.css';

/** Duration families, keyed by their x-axis title. */
const durationGroups = { fast, moderate, slow };

/** Easing families, keyed by their x-axis title. */
const easingGroups = { standard, entrance, exit };

type DurationFamily = keyof typeof durationGroups;
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
  Object.keys(durationGroups) as ReadonlyArray<DurationFamily>
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
const easeDuration = `calc(${slow[2]} * 2)`;

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
        <div
          class={css.swatch}
          style={assignInlineVars({
            [css.durationVar]:
              props.durationFamily && props.step
                ? durationGroups[props.durationFamily][props.step]
                : undefined,
          })}
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
