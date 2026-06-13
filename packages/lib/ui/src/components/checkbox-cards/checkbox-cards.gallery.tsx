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
 * Each gallery cell echoes the demoed axis value in its card labels
 * when the value isn't already obvious from the visual treatment —
 * the variant cell prefixes "surface" / "classic" and the color cell
 * prefixes "accent" / "danger" / etc. Size + disabled cells skip the
 * prefix (the size renders visibly; the disabled cell uses the
 * disabled affordance).
 *
 * The first card is preselected so the checked indicator color
 * shows up directly.
 */
const Demo = (
  props: Partial<CheckboxCardsRootProps> & { name: string; label?: string },
) => {
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
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Demo name={`variant-${variant}`} label={variant} variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo name={`color-${color}`} label={color} color={color} />
      )),
    },
    {
      title: 'Disabled',
      items: [<Demo name="disabled" disabled />],
    },
  ],
} satisfies GalleryListing;
