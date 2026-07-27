import { createSignal, For, untrack } from 'solid-js';
import IconChart from 'virtual:icons/mdi/chart-bar';
import IconList from 'virtual:icons/mdi/format-list-bulleted';
import IconTable from 'virtual:icons/mdi/table';
import type { Listing } from '#gallery';
import {
  SegmentedControlItem,
  SegmentedControlRoot,
  type SegmentedControlRootProps,
} from './segmented-control';

const OPTIONS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'sent', label: 'Sent' },
] as const;

const ICON_OPTIONS = [
  { value: 'list', label: 'List', icon: IconList },
  { value: 'table', label: 'Table', icon: IconTable },
  { value: 'chart', label: 'Chart', icon: IconChart },
] as const;

/**
 * `name` keeps each group's radios isolated — without it every demo on
 * the page would share one selection.
 */
type DemoProps = Partial<SegmentedControlRootProps> & {
  name?: string;
  /** Render an icon beside each label. */
  icons?: boolean;
  /** Render only the first two options, to show a two-column track. */
  pair?: boolean;
  /** Start with nothing selected. */
  empty?: boolean;
};

const Demo = (props: { name: string } & DemoProps) => {
  // Each listing cell mounts its own Demo with fixed props, so the
  // starting selection is read once and never re-derived.
  const [value, setValue] = createSignal<string | null>(
    untrack(() => (props.empty ? null : props.icons ? 'table' : 'drafts')),
  );

  const options = () => {
    if (props.icons) return ICON_OPTIONS;
    return props.pair ? OPTIONS.slice(0, 2) : OPTIONS;
  };

  return (
    <SegmentedControlRoot
      name={props.name}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      variant={props.variant}
      radius={props.radius}
      disabled={props.disabled}
      skeleton={props.skeleton}
      testId={props.name}
    >
      <For each={options()}>
        {(option) => (
          <SegmentedControlItem
            value={option.value}
            testId={`${props.name}-${option.value}`}
          >
            {'icon' in option && <option.icon />}
            {option.label}
          </SegmentedControlItem>
        )}
      </For>
    </SegmentedControlRoot>
  );
};

/**
 * Gallery listing for `SegmentedControl`. Enumerates the component across
 * its visual axes.
 */
export default {
  title: 'SegmentedControl',
  group: 'form',
  render: (props) => (
    <Demo {...props} name={props.name ?? 'segmented-control'} />
  ),
  sections: [
    {
      title: 'Size',
      align: { rows: 'center' },
      columns: [
        {
          title: 'Surface',
          props: { variant: 'surface' },
        },
        {
          title: 'Classic',
          props: { variant: 'classic' },
        },
      ],
      rows: [
        { title: '1', props: { size: 1, name: 'size-1' } },
        { title: '2', props: { size: 2, name: 'size-2' } },
        { title: '3', props: { size: 3, name: 'size-3' } },
      ],
    },
    {
      title: 'Radius',
      align: { rows: 'center' },
      rows: [
        { title: 'None', props: { radius: 'none', name: 'radius-none' } },
        { title: 'Small', props: { radius: 'small', name: 'radius-small' } },
        { title: 'Medium', props: { radius: 'medium', name: 'radius-medium' } },
        { title: 'Large', props: { radius: 'large', name: 'radius-large' } },
        { title: 'Full', props: { radius: 'full', name: 'radius-full' } },
      ],
    },
    {
      title: 'States',
      align: { rows: 'center' },
      rows: [
        { title: 'Default', props: { name: 'state-default' } },
        {
          title: 'Disabled',
          props: { disabled: true, name: 'state-disabled' },
        },
        { title: 'No selection', props: { empty: true, name: 'state-empty' } },
        { title: 'Two segments', props: { pair: true, name: 'state-pair' } },
        { title: 'With icons', props: { icons: true, name: 'state-icons' } },
        {
          title: 'Skeleton',
          props: { skeleton: true, name: 'state-skeleton' },
        },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
