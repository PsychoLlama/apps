import { createSignal, For } from 'solid-js';
import type { Listing } from '#gallery';
import {
  CheckboxCardsItem,
  CheckboxCardsRoot,
  type CheckboxCardsRootProps,
} from './checkbox-cards';

const OPTIONS = [1, 2] as const;

/**
 * `name` keeps each group isolated. The first card is preselected so the
 * checked indicator color shows up directly.
 */
type DemoProps = Partial<CheckboxCardsRootProps> & {
  name?: string;
};

const Demo = (props: { name: string } & DemoProps) => {
  const [value, setValue] = createSignal<string[]>(['1']);
  return (
    <CheckboxCardsRoot
      name={props.name}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      variant={props.variant}
      color={props.color}
      disabled={props.disabled}
      columns={2}
      testId={props.name}
    >
      <For each={OPTIONS}>
        {(option) => (
          <CheckboxCardsItem
            value={String(option)}
            testId={`${props.name}-${option}`}
          >
            Option {option}
          </CheckboxCardsItem>
        )}
      </For>
    </CheckboxCardsRoot>
  );
};

/**
 * Gallery listing for `CheckboxCards`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'CheckboxCards',
  group: 'form',
  render: (props) => (
    <Demo
      {...props}
      name={`${props.name ?? 'checkbox-cards'}${props.disabled ? '-disabled' : ''}`}
    />
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        {
          title: 'Surface',
          props: { variant: 'surface', name: 'variant-surface' },
        },
        {
          title: 'Classic',
          props: { variant: 'classic', name: 'variant-classic' },
        },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
    {
      title: 'Color',
      rows: [
        {
          title: 'Accent',
          props: { color: 'accent', name: 'color-accent' },
        },
        {
          title: 'Neutral',
          props: { color: 'neutral', name: 'color-neutral' },
        },
        {
          title: 'Danger',
          props: { color: 'danger', name: 'color-danger' },
        },
        {
          title: 'Warning',
          props: { color: 'warning', name: 'color-warning' },
        },
        {
          title: 'Success',
          props: { color: 'success', name: 'color-success' },
        },
      ],
      columns: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
