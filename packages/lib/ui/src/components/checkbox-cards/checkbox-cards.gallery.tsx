import { createSignal, For } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  CheckboxCardsItem,
  CheckboxCardsRoot,
  type CheckboxCardsRootProps,
} from './checkbox-cards';

const VARIANTS = ['surface', 'classic'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
] as const;

/**
 * Each gallery cell echoes the demoed axis value in its card labels via the
 * `label` prefix when the value isn't already obvious from the visual
 * treatment. `name` keeps each group isolated. The first card is preselected so
 * the checked indicator color shows up directly.
 */
type DemoProps = Partial<CheckboxCardsRootProps> & {
  name?: string;
  label?: string;
};

const Demo = (props: { name: string } & DemoProps) => {
  const [value, setValue] = createSignal<string[]>(['basic']);
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
            value={option.value}
            testId={`${props.name}-${option.value}`}
          >
            {props.label ? `${props.label} ${option.label}` : option.label}
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
  render: (props) => <Demo {...props} name={props.name ?? 'checkbox-cards'} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, label: variant, name: `variant-${variant}` },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, label: color, name: `color-${color}` },
      })),
    },
    {
      title: 'Disabled',
      columns: [
        { title: 'Disabled', props: { disabled: true, name: 'disabled' } },
      ],
    },
  ],
} satisfies GalleryListing<DemoProps>;
