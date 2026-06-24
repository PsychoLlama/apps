import { createSignal, untrack } from 'solid-js';
import type { Listing } from '#gallery';
import Switch, { type SwitchProps } from './switch';

/** Demo-only knob: the initial checked state. */
type DemoProps = Partial<SwitchProps> & {
  initialChecked?: boolean;
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

/**
 * Gallery listing for `Switch`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Switch',
  group: 'form',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
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
      title: 'Size',
      columns: [
        { title: 'Size 1', props: { size: 1 } },
        { title: 'Size 2', props: { size: 2 } },
        { title: 'Size 3', props: { size: 3 } },
      ],
    },
  ],
} satisfies Listing<SwitchProps & { initialChecked?: boolean }>;
