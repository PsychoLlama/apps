import { createSignal, Show, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Checkbox, { type CheckboxChecked, type CheckboxProps } from './checkbox';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './checkbox.gallery.css';

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
      columns: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
        { title: 'Danger', props: { color: 'danger' } },
        { title: 'Warning', props: { color: 'warning' } },
        { title: 'Success', props: { color: 'success' } },
      ],
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
      columns: [
        { title: 'Size 1', props: { size: 1, wrapText: 4 } },
        { title: 'Size 2', props: { size: 2, wrapText: 5 } },
        { title: 'Size 3', props: { size: 3, wrapText: 6 } },
      ],
    },
  ],
} satisfies GalleryListing<
  CheckboxProps & { initialChecked?: CheckboxChecked; wrapText?: 4 | 5 | 6 }
>;
