import { createSignal, Show, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Checkbox, { type CheckboxChecked, type CheckboxProps } from './checkbox';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './checkbox.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

/** Demo-only knobs: the initial checked state and an optional wrapping-label size. */
type DemoProps = Partial<CheckboxProps> & {
  initialChecked?: CheckboxChecked;
  wrapText?: 4 | 5 | 6;
};

const Demo = (props: DemoProps) => {
  const [checked, setChecked] = createSignal<CheckboxChecked>(
    untrack(() => props.initialChecked ?? true),
  );
  return (
    <Checkbox
      {...props}
      checked={checked()}
      onCheckedChange={setChecked}
      testId="checkbox"
    />
  );
};

// Mismatched checkbox/text sizes — a small checkbox inside larger-text
// copy is the case that surfaces the line-height tracking. With
// matched sizes the box height already equals the text's line-height,
// so the fix is invisible there.
const WrappingDemo = (props: {
  checkboxSize: 1 | 2 | 3;
  textSize: 4 | 5 | 6;
}) => {
  const [checked, setChecked] = createSignal(true);
  return (
    <Text as="label" size={props.textSize} selectable class={css.wrappingLabel}>
      <Flex as="div" gap={2}>
        <Checkbox
          size={props.checkboxSize}
          checked={checked()}
          onCheckedChange={setChecked}
          testId="checkbox"
        />
        A longer label that wraps across two or three lines so the checkbox
        stays aligned with the first line of text.
      </Flex>
    </Text>
  );
};

/**
 * Gallery listing for `Checkbox`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'Checkbox',
  render: (props) => (
    <Show when={props.wrapText} keyed fallback={<Demo {...props} />}>
      {(textSize) => (
        <WrappingDemo checkboxSize={props.size ?? 1} textSize={textSize} />
      )}
    </Show>
  ),
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({ title: color, props: { color } })),
    },
    {
      title: 'State',
      columns: [
        { title: 'Off', props: { initialChecked: false } },
        { title: 'On', props: { initialChecked: true } },
        { title: 'Mixed', props: { initialChecked: 'indeterminate' } },
        {
          title: 'Off disabled',
          props: { initialChecked: false, disabled: true },
        },
        {
          title: 'On disabled',
          props: { initialChecked: true, disabled: true },
        },
        {
          title: 'Mixed disabled',
          props: { initialChecked: 'indeterminate', disabled: true },
        },
      ],
    },
    {
      title: 'With label',
      columns: [
        {
          title: 'Checked',
          props: { initialChecked: true, children: 'Subscribe to updates' },
        },
        {
          title: 'Mixed',
          props: {
            initialChecked: 'indeterminate',
            children: 'Some items selected',
          },
        },
        {
          title: 'Disabled',
          props: {
            initialChecked: false,
            disabled: true,
            children: 'Disabled option',
          },
        },
      ],
    },
    {
      title: 'Wrapping labels',
      columns: SIZES.map((size, index) => ({
        title: `Size ${size}`,
        props: { size, wrapText: (4 + index) as 4 | 5 | 6 },
      })),
    },
  ],
} satisfies GalleryListing<
  CheckboxProps & { initialChecked?: CheckboxChecked; wrapText?: 4 | 5 | 6 }
>;
