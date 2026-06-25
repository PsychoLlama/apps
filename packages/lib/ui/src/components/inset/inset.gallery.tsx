import type { Listing } from '#gallery';
import Card from '../card/card';
import Inset, { type InsetProps } from './inset';
import * as css from './inset.gallery.css';

/**
 * Gallery listing for `Inset`. Each cell is a `Card` holding a single bled
 * media block — the card surface peeking on the non-bled sides is what makes
 * the cutout legible, so the demos stay caption-free.
 */
export default {
  title: 'Inset',
  group: 'layout',
  render: (props) => (
    <Card as="div" class={css.card}>
      <Inset as="div" {...props}>
        <div class={css.media} />
      </Inset>
    </Card>
  ),
  sections: [
    {
      title: 'Side',
      columns: [
        { title: 'All', props: { side: 'all' } },
        { title: 'X', props: { side: 'x' } },
        { title: 'Y', props: { side: 'y' } },
        { title: 'Top', props: { side: 'top' } },
        { title: 'Bottom', props: { side: 'bottom' } },
        { title: 'Left', props: { side: 'left' } },
        { title: 'Right', props: { side: 'right' } },
      ],
    },
    {
      title: 'Pad',
      columns: [
        { title: 'Reserved', props: { side: 'top', pad: true } },
        { title: 'Flush', props: { side: 'top', pad: false } },
      ],
    },
  ],
} satisfies Listing<InsetProps<'div'>>;
