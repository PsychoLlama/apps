import { createSignal, For } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  RadioCardsItem,
  RadioCardsRoot,
  type RadioCardsRootProps,
} from './radio-cards';

const OPTIONS = [1, 2] as const;

/**
 * Each gallery cell echoes the demoed axis value in its card labels via the
 * `label` prefix when the value isn't already obvious from the visual
 * treatment. `name` keeps each group's radios isolated. The second card is
 * preselected so the checked + indicator color shows up directly.
 */
type DemoProps = Partial<RadioCardsRootProps> & {
  name?: string;
  label?: string;
};

const Demo = (props: { name: string } & DemoProps) => {
  const [value, setValue] = createSignal<string | null>('2');
  return (
    <RadioCardsRoot
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
          <RadioCardsItem
            value={String(option)}
            testId={`${props.name}-${option}`}
          >
            {props.label ? `${props.label} ${option}` : option}
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );
};

/**
 * Gallery listing for `RadioCards`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'RadioCards',
  render: (props) => (
    <Demo
      {...props}
      name={`${props.name ?? 'radio-cards'}${props.disabled ? '-disabled' : ''}`}
    />
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        {
          title: 'Surface',
          props: {
            variant: 'surface',
            label: 'surface',
            name: 'variant-surface',
          },
        },
        {
          title: 'Classic',
          props: {
            variant: 'classic',
            label: 'classic',
            name: 'variant-classic',
          },
        },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
    {
      title: 'Color',
      columns: [
        {
          title: 'Accent',
          props: { color: 'accent', label: 'accent', name: 'color-accent' },
        },
        {
          title: 'Neutral',
          props: { color: 'neutral', label: 'neutral', name: 'color-neutral' },
        },
        {
          title: 'Danger',
          props: { color: 'danger', label: 'danger', name: 'color-danger' },
        },
        {
          title: 'Warning',
          props: { color: 'warning', label: 'warning', name: 'color-warning' },
        },
        {
          title: 'Success',
          props: { color: 'success', label: 'success', name: 'color-success' },
        },
      ],
    },
  ],
} satisfies GalleryListing<DemoProps>;
