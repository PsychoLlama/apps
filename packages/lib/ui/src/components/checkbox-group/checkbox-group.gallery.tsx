import { createSignal, For } from 'solid-js';
import type { Listing } from '#gallery';
import {
  CheckboxGroupItem,
  CheckboxGroupRoot,
  type CheckboxGroupRootProps,
} from './checkbox-group';

const OPTIONS = ['Email', 'Push', 'SMS'] as const;

/**
 * `name` keeps each group isolated. The first item is preselected so the
 * checked indicator color shows up directly.
 */
type DemoProps = Partial<CheckboxGroupRootProps> & {
  name?: string;
};

const Demo = (props: { name: string } & DemoProps) => {
  const [value, setValue] = createSignal<string[]>([OPTIONS[0]]);
  return (
    <CheckboxGroupRoot
      name={props.name}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      variant={props.variant}
      color={props.color}
      disabled={props.disabled}
      testId={props.name}
    >
      <For each={OPTIONS}>
        {(option) => (
          <CheckboxGroupItem value={option} testId={`${props.name}-${option}`}>
            {option}
          </CheckboxGroupItem>
        )}
      </For>
    </CheckboxGroupRoot>
  );
};

/**
 * Gallery listing for `CheckboxGroup`. Enumerates the component across
 * its visual axes.
 */
export default {
  title: 'CheckboxGroup',
  group: 'form',
  render: (props) => (
    <Demo
      {...props}
      name={`${props.name ?? 'checkbox-group'}${props.disabled ? '-disabled' : ''}`}
    />
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        {
          title: 'Classic',
          props: { variant: 'classic', name: 'variant-classic' },
        },
        {
          title: 'Surface',
          props: { variant: 'surface', name: 'variant-surface' },
        },
        { title: 'Soft', props: { variant: 'soft', name: 'variant-soft' } },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent', name: 'color-accent' } },
        {
          title: 'Neutral',
          props: { color: 'neutral', name: 'color-neutral' },
        },
        { title: 'Danger', props: { color: 'danger', name: 'color-danger' } },
        {
          title: 'Warning',
          props: { color: 'warning', name: 'color-warning' },
        },
        {
          title: 'Success',
          props: { color: 'success', name: 'color-success' },
        },
      ],
    },
    {
      title: 'Size',
      columns: [
        { title: '1', props: { size: 1, name: 'size-1' } },
        { title: '2', props: { size: 2, name: 'size-2' } },
        { title: '3', props: { size: 3, name: 'size-3' } },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
