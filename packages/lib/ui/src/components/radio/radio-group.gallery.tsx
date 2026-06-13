import { createSignal, Show } from 'solid-js';
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

/** Each radio group needs a unique `name`; `wrap` swaps in the wrapping demo. */
type DemoProps = Partial<RadioGroupRootProps> & {
  name?: string;
  wrap?: boolean;
};

const Demo = (props: { name: string } & Partial<RadioGroupRootProps>) => {
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
  title: 'RadioGroup',
  render: (props) => (
    <Show
      when={props.wrap}
      fallback={<Demo {...props} name={props.name ?? 'radio-group'} />}
    >
      <WrappingDemo size={props.size ?? 1} />
    </Show>
  ),
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, name: `radio-variant-${variant}` },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, name: `radio-color-${color}` },
      })),
    },
    {
      title: 'Disabled',
      columns: [
        {
          title: 'Disabled',
          props: { disabled: true, name: 'radio-disabled' },
        },
      ],
    },
    {
      title: 'Wrapping labels',
      columns: SIZES.map((size) => ({
        title: `Size ${size}`,
        props: { size, wrap: true },
      })),
    },
  ],
} satisfies GalleryListing<DemoProps>;
