import { createSignal, Show, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Switch, { type SwitchProps } from './switch';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './switch.gallery.css';

/** Demo-only knobs: the initial checked state and an optional wrapping-label size. */
type DemoProps = Partial<SwitchProps> & {
  initialChecked?: boolean;
  wrapText?: 4 | 5 | 6;
};

const Demo = (props: DemoProps) => {
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
  title: 'Switch',
  render: (props) => (
    <Show when={props.wrapText} keyed fallback={<Demo {...props} />}>
      {(textSize) => (
        <WrappingDemo switchSize={props.size ?? 1} textSize={textSize} />
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
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
    {
      title: 'State',
      columns: [
        { title: 'Off', props: { initialChecked: false } },
        { title: 'On', props: { initialChecked: true } },
        {
          title: 'Off disabled',
          props: { initialChecked: false, disabled: true },
        },
        {
          title: 'On disabled',
          props: { initialChecked: true, disabled: true },
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
  SwitchProps & { initialChecked?: boolean; wrapText?: 4 | 5 | 6 }
>;
