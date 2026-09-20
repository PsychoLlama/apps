import { splitProps } from 'solid-js';
import type { Listing } from '#gallery';
import IconPlus from 'virtual:icons/mdi/plus';
import clx from '@lib/classnames';
import IconButton from '../icon-button/icon-button';
import Tooltip, { type TooltipProps } from './tooltip';
import { showGraceArea } from './grace-area.css';
import * as css from './tooltip.gallery.css';

/**
 * What the gallery varies on top of the component's own props. The
 * grace area — the strip the pointer crosses between trigger and
 * tooltip — is invisible by design, so the gallery paints it.
 */
interface GalleryProps extends TooltipProps {
  graceArea?: boolean;
}

/**
 * Gallery listing for `Tooltip`. Every cell is a trigger — focus it to
 * see the window.
 */
export default {
  title: 'Tooltip',
  group: 'display',
  render: (all) => {
    const [gallery, props] = splitProps(all, ['graceArea']);

    return (
      <div class={clx(css.stage, gallery.graceArea && showGraceArea)}>
        <Tooltip
          display="inline"
          content="Add to library"
          testId="tooltip"
          {...props}
        >
          {(trigger) => (
            <IconButton
              aria-label="Add"
              variant="soft"
              color="neutral"
              testId="trigger"
              {...trigger}
            >
              <IconPlus />
            </IconButton>
          )}
        </Tooltip>
      </div>
    );
  },
  sections: [
    {
      title: 'Side',
      columns: [
        { title: 'Top', props: { side: 'top' } },
        { title: 'Bottom', props: { side: 'bottom' } },
        { title: 'Left', props: { side: 'left' } },
        { title: 'Right', props: { side: 'right' } },
      ],
    },
    {
      title: 'Align',
      columns: [
        { title: 'Start', props: { align: 'start' } },
        { title: 'Center', props: { align: 'center' } },
        { title: 'End', props: { align: 'end' } },
      ],
    },
    {
      title: 'Content',
      columns: [
        { title: 'Default', props: {} },
        {
          title: 'Wrapping',
          props: {
            content:
              'Adds the track to your library and to every device signed into this account.',
            maxWidth: '200px',
          },
        },
      ],
    },
    // TODO: Delete this listing once the grace area's shape is settled.
    {
      title: 'Grace area',
      columns: [
        { title: 'Top', props: { side: 'top', graceArea: true } },
        { title: 'Bottom', props: { side: 'bottom', graceArea: true } },
        { title: 'Left', props: { side: 'left', graceArea: true } },
        { title: 'Right', props: { side: 'right', graceArea: true } },
      ],
      rows: [
        { title: 'Default offset', props: {} },
        { title: 'Wide offset', props: { sideOffset: 16 } },
        { title: 'Start-aligned', props: { align: 'start' } },
        { title: 'End-aligned', props: { align: 'end' } },
        { title: 'Nudged along', props: { align: 'start', alignOffset: 24 } },
        { title: 'Pass-through', props: { hoverable: false } },
      ],
    },
    {
      title: 'Hoverable',
      columns: [
        { title: 'Reachable', props: {} },
        { title: 'Pass-through', props: { hoverable: false } },
      ],
    },
  ],
} satisfies Listing<GalleryProps>;
