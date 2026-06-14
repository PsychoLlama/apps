import { createSignal, untrack } from 'solid-js';
import type { GalleryListing } from '@lib/gallery';
import Checkbox, { type CheckboxChecked, type CheckboxProps } from './checkbox';

/** Demo-only knob: the initial checked state. */
type DemoProps = Partial<CheckboxProps> & {
  initialChecked?: CheckboxChecked;
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

/**
 * Gallery listing for `Checkbox`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'Checkbox',
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
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
    {
      title: 'State',
      columns: [
        { title: 'Off', props: { initialChecked: false } },
        { title: 'On', props: { initialChecked: true } },
        { title: 'Mixed', props: { initialChecked: 'indeterminate' } },
      ],
    },
    {
      title: 'Labeled',
      rows: [
        {
          title: 'Checked',
          props: { initialChecked: true, children: 'Subscribe to updates' },
        },
        {
          title: 'Mixed',
          props: {
            initialChecked: 'indeterminate',
            children: 'Subscribe to updates',
          },
        },
        {
          title: 'Disabled',
          props: {
            initialChecked: false,
            disabled: true,
            children: 'Subscribe to updates',
          },
        },
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
} satisfies GalleryListing<
  CheckboxProps & { initialChecked?: CheckboxChecked }
>;
