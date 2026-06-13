import { createSignal, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Checkbox, { type CheckboxChecked, type CheckboxProps } from './checkbox';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './checkbox.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

const Demo = (
  props: Partial<CheckboxProps> & { initialChecked?: CheckboxChecked },
) => {
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
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Demo variant={variant} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Demo color={color} />),
    },
    {
      title: 'State',
      items: [
        <Demo initialChecked={false} />,
        <Demo initialChecked={true} />,
        <Demo initialChecked="indeterminate" />,
        <Demo initialChecked={false} disabled />,
        <Demo initialChecked={true} disabled />,
        <Demo initialChecked="indeterminate" disabled />,
      ],
    },
    {
      title: 'With label',
      items: [
        <Demo initialChecked={true}>Subscribe to updates</Demo>,
        <Demo initialChecked="indeterminate">Some items selected</Demo>,
        <Demo initialChecked={false} disabled>
          Disabled option
        </Demo>,
      ],
    },
    {
      title: 'Wrapping labels',
      items: SIZES.map((checkboxSize, index) => {
        const textSize = (4 + index) as 4 | 5 | 6;
        return <WrappingDemo checkboxSize={checkboxSize} textSize={textSize} />;
      }),
    },
  ],
} satisfies GalleryListing;
