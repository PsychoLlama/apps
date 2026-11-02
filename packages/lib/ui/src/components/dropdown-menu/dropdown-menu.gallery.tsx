import { createSignal, createUniqueId } from 'solid-js';
import type { Listing } from '#gallery';
import Button from '../button/button';
import DropdownMenu, { type DropdownMenuProps } from './dropdown-menu';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTriggerIcon,
  type DropdownMenuChecked,
} from './parts';
import * as css from './dropdown-menu.gallery.css';

/** What a cell can vary. The state and the trigger are the demo's. */
type DemoProps = Partial<
  Omit<DropdownMenuProps, 'open' | 'onOpenChange' | 'children' | 'content'>
>;

/**
 * One menu with its own state. Each cell holds a trigger rather than an
 * open menu, so the gallery stays readable.
 */
const Demo = (props: DemoProps) => {
  const [open, setOpen] = createSignal(false);
  const [grid, setGrid] = createSignal<DropdownMenuChecked>(true);
  const [rulers, setRulers] =
    createSignal<DropdownMenuChecked>('indeterminate');
  const [zoom, setZoom] = createSignal('fit');
  const viewId = createUniqueId();
  const zoomId = createUniqueId();

  return (
    <div class={props.side ? css.seated[props.side] : css.stage}>
      <DropdownMenu
        display="block"
        testId="menu"
        {...props}
        open={open()}
        onOpenChange={setOpen}
        content={
          <>
            <DropdownMenuItem shortcut="⌘ E" testId="edit">
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem shortcut="⌘ D" testId="duplicate">
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem disabled testId="archive">
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup aria-labelledby={viewId}>
              <DropdownMenuLabel id={viewId}>View</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={grid()}
                onCheckedChange={setGrid}
                shortcut="⌘ '"
                testId="grid"
              >
                Show grid
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={rulers()}
                onCheckedChange={setRulers}
                testId="rulers"
              >
                Show rulers
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel id={zoomId}>Zoom</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              aria-labelledby={zoomId}
              value={zoom()}
              onValueChange={setZoom}
            >
              <DropdownMenuRadioItem value="fit" testId="zoom-fit">
                Fit
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="100" testId="zoom-100">
                100%
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem color="danger" shortcut="⌘ ⌫" testId="delete">
              Delete
            </DropdownMenuItem>
          </>
        }
      >
        {(trigger) => (
          <Button
            as="button"
            variant="soft"
            color="neutral"
            testId="trigger"
            {...trigger}
          >
            Options
            <DropdownMenuTriggerIcon />
          </Button>
        )}
      </DropdownMenu>
    </div>
  );
};

/** Gallery listing for `DropdownMenu`. Every cell is a trigger. */
export default {
  title: 'DropdownMenu',
  group: 'display',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
      ],
    },
    {
      title: 'Variant',
      columns: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
    },
    {
      title: 'Size',
      columns: [
        { title: '1', props: { size: 1 } },
        { title: '2', props: { size: 2 } },
      ],
    },
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
  ],
} satisfies Listing<DemoProps>;
