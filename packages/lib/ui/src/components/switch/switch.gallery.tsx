import { createSignal, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Switch, { type SwitchProps } from './switch';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './switch.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const Demo = (props: Partial<SwitchProps> & { initialChecked?: boolean }) => {
  const [checked, setChecked] = createSignal(
    untrack(() => props.initialChecked ?? true),
  );
  return (
    <Switch
      {...props}
      checked={checked()}
      onCheckedChange={setChecked}
      testId="switch"
    />
  );
};

// Mismatched switch/text sizes — a small switch inside larger-text
// copy is the case that surfaces the line-height tracking. With matched
// sizes the switch's intrinsic track height already equals the text's
// line-height, so the fix is invisible there.
const WrappingDemo = (props: {
  switchSize: 1 | 2 | 3;
  textSize: 4 | 5 | 6;
}) => {
  const [checked, setChecked] = createSignal(true);
  return (
    <Text as="label" size={props.textSize} selectable class={css.wrappingLabel}>
      <Flex as="div" gap={2}>
        <Switch
          size={props.switchSize}
          checked={checked()}
          onCheckedChange={setChecked}
          testId="switch"
        />
        A longer label that wraps across two or three lines so the switch stays
        aligned with the first line of text.
      </Flex>
    </Text>
  );
};

/**
 * Gallery listing for `Switch`. Enumerates the component across its visual
 * axes.
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
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'State',
      items: [
        <Demo initialChecked={false} />,
        <Demo initialChecked={true} />,
        <Demo initialChecked={false} disabled />,
        <Demo initialChecked={true} disabled />,
      ],
    },
    {
      title: 'Wrapping labels',
      items: SIZES.map((switchSize, index) => {
        const textSize = (4 + index) as 4 | 5 | 6;
        return <WrappingDemo switchSize={switchSize} textSize={textSize} />;
      }),
    },
  ],
} satisfies GalleryListing;
