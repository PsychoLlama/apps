import { createSignal } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  RadioGroupItem,
  RadioGroupRoot,
  type RadioGroupRootProps,
} from './radio-group';
import * as css from './radio-group.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

const Demo = (props: Partial<RadioGroupRootProps> & { name: string }) => {
  const [value, setValue] = createSignal<string | null>('apple');
  return (
    <RadioGroupRoot
      name={props.name}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      variant={props.variant}
      color={props.color}
      disabled={props.disabled}
      testId="radio-group"
    >
      <RadioGroupItem value="apple" testId="radio-apple">
        Apple
      </RadioGroupItem>
      <RadioGroupItem value="banana" testId="radio-banana">
        Banana
      </RadioGroupItem>
      <RadioGroupItem value="cherry" testId="radio-cherry">
        Cherry
      </RadioGroupItem>
    </RadioGroupRoot>
  );
};

const WrappingDemo = (props: { size: 1 | 2 | 3 }) => {
  const [value, setValue] = createSignal<string | null>('first');
  return (
    <RadioGroupRoot
      name={`radio-wrapping-${props.size}`}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      class={css.wrappingGroup}
      testId="radio-group"
    >
      <RadioGroupItem value="first" testId="radio-first">
        A short label that fits on one line.
      </RadioGroupItem>
      <RadioGroupItem value="second" testId="radio-second">
        A longer label that wraps across two or three lines so the radio stays
        aligned with the first line of text.
      </RadioGroupItem>
    </RadioGroupRoot>
  );
};

/**
 * Gallery listing for `RadioGroup`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Demo name={`radio-variant-${variant}`} variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo name={`radio-color-${color}`} color={color} />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Demo name={`radio-size-${size}`} size={size} />
      )),
    },
    {
      title: 'Disabled',
      items: [<Demo name="radio-disabled" disabled />],
    },
    {
      title: 'Wrapping labels',
      items: SIZES.map((size) => <WrappingDemo size={size} />),
    },
  ],
} satisfies GalleryListing;
