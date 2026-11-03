import { createSignal, createUniqueId } from 'solid-js';
import type { Listing } from '#gallery';
import Text from '../text/text';
import ContextMenu, { type ContextMenuProps } from './context-menu';
import {
  ContextMenuCheckboxItem,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  type ContextMenuChecked,
} from './parts';
import * as css from './context-menu.gallery.css';

/** What a cell can vary. The state and the area are the demo's. */
type DemoProps = Partial<
  Omit<ContextMenuProps, 'open' | 'onOpenChange' | 'children' | 'content'>
>;

/**
 * One menu with its own state. Each cell holds an area rather than an
 * open menu, so the gallery stays readable.
 */
const Demo = (props: DemoProps) => {
  const [open, setOpen] = createSignal(false);
  const [grid, setGrid] = createSignal<ContextMenuChecked>(true);
  const [rulers, setRulers] = createSignal<ContextMenuChecked>('indeterminate');
  const [zoom, setZoom] = createSignal('fit');
  const viewId = createUniqueId();
  const zoomId = createUniqueId();

  return (
    <ContextMenu
      display="block"
      testId="menu"
      {...props}
      open={open()}
      onOpenChange={setOpen}
      content={
        <>
          <ContextMenuItem shortcut="⌘ C" testId="copy">
            Copy
          </ContextMenuItem>
          <ContextMenuItem shortcut="⌘ V" testId="paste">
            Paste
          </ContextMenuItem>
          <ContextMenuItem disabled testId="archive">
            Archive
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuGroup aria-labelledby={viewId}>
            <ContextMenuLabel id={viewId}>View</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={grid()}
              onCheckedChange={setGrid}
              shortcut="⌘ '"
              testId="grid"
            >
              Show grid
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={rulers()}
              onCheckedChange={setRulers}
              testId="rulers"
            >
              Show rulers
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuLabel id={zoomId}>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup
            aria-labelledby={zoomId}
            value={zoom()}
            onValueChange={setZoom}
          >
            <ContextMenuRadioItem value="fit" testId="zoom-fit">
              Fit
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="100" testId="zoom-100">
              100%
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem color="danger" shortcut="⌘ ⌫" testId="delete">
            Delete
          </ContextMenuItem>
        </>
      }
    >
      <Text as="p" size={2} selectable={false} class={css.area}>
        Right-click here
      </Text>
    </ContextMenu>
  );
};

/** Gallery listing for `ContextMenu`. Every cell is an area. */
export default {
  title: 'ContextMenu',
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
  ],
} satisfies Listing<DemoProps>;
