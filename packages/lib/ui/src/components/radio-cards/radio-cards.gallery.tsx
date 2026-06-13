import { createSignal, For } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  RadioCardsItem,
  RadioCardsRoot,
  type RadioCardsRootProps,
} from './radio-cards';

const VARIANTS = ['surface', 'classic'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const OPTIONS = [1, 2] as const;

/**
 * Each gallery cell echoes the demoed axis value in its card labels
 * when the value isn't already obvious from the visual treatment —
 * the variant cell prefixes "surface" / "classic" and the color cell
 * prefixes "accent" / "danger" / etc. Size + disabled cells skip the
 * prefix (the size renders visibly; the disabled cell uses the
 * disabled affordance) to avoid awkward "size 1 1" repetition.
 *
 * The second card is preselected so the checked + indicator color
 * shows up directly.
 */
const Demo = (
  props: Partial<RadioCardsRootProps> & { name: string; label?: string },
) => {
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
