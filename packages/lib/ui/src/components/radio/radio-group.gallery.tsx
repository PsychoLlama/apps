import { createSignal, Show } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  RadioGroupItem,
  RadioGroupRoot,
  type RadioGroupRootProps,
} from './radio-group';
import * as css from './radio-group.gallery.css';

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
      columns: [
        {
          title: 'Classic',
          props: { variant: 'classic', name: 'radio-variant-classic' },
        },
        {
          title: 'Surface',
          props: { variant: 'surface', name: 'radio-variant-surface' },
        },
        {
          title: 'Soft',
          props: { variant: 'soft', name: 'radio-variant-soft' },
        },
      ],
    },
    {
      title: 'Color',
      columns: [
        {
          title: 'Accent',
          props: { color: 'accent', name: 'radio-color-accent' },
        },
        {
          title: 'Neutral',
          props: { color: 'neutral', name: 'radio-color-neutral' },
        },
        {
          title: 'Danger',
          props: { color: 'danger', name: 'radio-color-danger' },
        },
        {
          title: 'Warning',
          props: { color: 'warning', name: 'radio-color-warning' },
        },
        {
          title: 'Success',
          props: { color: 'success', name: 'radio-color-success' },
        },
      ],
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
      columns: [
        { title: 'Size 1', props: { size: 1, wrap: true } },
        { title: 'Size 2', props: { size: 2, wrap: true } },
        { title: 'Size 3', props: { size: 3, wrap: true } },
      ],
    },
  ],
} satisfies GalleryListing<DemoProps>;
