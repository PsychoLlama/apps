import type { Listing } from '#gallery';
import IconPlus from 'virtual:icons/mdi/plus';
import IconButton from '../icon-button/icon-button';
import Tooltip, { type TooltipProps } from './tooltip';
import * as css from './tooltip.gallery.css';

/**
 * Gallery listing for `Tooltip`. Every cell is a trigger — focus it to
 * see the window.
 */
export default {
  title: 'Tooltip',
  group: 'display',
  render: (props) => (
    <div class={css.stage}>
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
  ),
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
  ],
} satisfies Listing<TooltipProps>;
