import { Show } from 'solid-js';
import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import { entrance, exit, fast, moderate, slow, standard } from '@lib/design';
import * as css from './motion.gallery.css';

/**
 * One animated cell. The Durations section supplies `duration` (driving the
 * pulse swatch); the Easings section supplies `easing` (driving the slide
 * thumb). `render` branches on which is present.
 */
interface Motion {
  /** Animation duration token for the pulse swatch. */
  duration: string;
  /** Easing curve token for the slide thumb. */
  easing: string;
}

/** One column per duration token, fastest to slowest. */
const durations: ReadonlyArray<GalleryAxis<Motion>> = [
  { title: 'fast[1]', props: { duration: fast[1] } },
  { title: 'fast[2]', props: { duration: fast[2] } },
  { title: 'moderate[1]', props: { duration: moderate[1] } },
  { title: 'moderate[2]', props: { duration: moderate[2] } },
  { title: 'slow[1]', props: { duration: slow[1] } },
  { title: 'slow[2]', props: { duration: slow[2] } },
];

/** One column per easing curve, grouped standard → entrance → exit. */
const easings: ReadonlyArray<GalleryAxis<Motion>> = [
  { title: 'standard.productive', props: { easing: standard.productive } },
  { title: 'standard.expressive', props: { easing: standard.expressive } },
  { title: 'entrance.productive', props: { easing: entrance.productive } },
  { title: 'entrance.expressive', props: { easing: entrance.expressive } },
  { title: 'exit.productive', props: { easing: exit.productive } },
  { title: 'exit.expressive', props: { easing: exit.expressive } },
];

/** A long, fixed slide so the easing curve — not the speed — reads. */
const easeDuration = `calc(${slow[2]} * 2)`;

/**
 * Gallery listing for `@lib/design`'s motion tokens. Two x-axis views: durations
 * pulse a swatch at increasing speeds, easings slide a thumb along each curve at
 * a shared, deliberate pace.
 */
export default {
  title: 'Motion',
  render: (props) => (
    <Show
      when={props.easing}
      fallback={
        <div class={css.swatch} style={{ '--duration': props.duration }} />
      }
    >
      {(easing) => (
        <div
          class={css.track}
          style={{ '--easing': easing(), '--duration': easeDuration }}
        >
          <div class={css.thumb} />
        </div>
      )}
    </Show>
  ),
  sections: [
    { title: 'Durations', align: { columns: 'center' }, columns: durations },
    { title: 'Easings', columns: easings },
  ],
} satisfies GalleryListing<Motion>;
