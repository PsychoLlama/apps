import { createSignal } from 'solid-js';
import type { Listing } from '#gallery';
import {
  RadioGroupItem,
  RadioGroupRoot,
  type RadioGroupRootProps,
} from './radio-group';

/** Each radio group needs a unique `name`; disabled cells get a `-disabled` suffix. */
type DemoProps = Partial<RadioGroupRootProps> & {
  name?: string;
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

/**
 * Gallery listing for `RadioGroup`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'RadioGroup',
  group: 'form',
  render: (props) => (
    <Demo
      {...props}
      name={`${props.name ?? 'radio-group'}${props.disabled ? '-disabled' : ''}`}
    />
  ),
  sections: [
    {
      title: 'Theme colors',
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
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
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
      title: 'Size',
      columns: [
        { title: '1', props: { size: 1, name: 'radio-size-1' } },
        { title: '2', props: { size: 2, name: 'radio-size-2' } },
        { title: '3', props: { size: 3, name: 'radio-size-3' } },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
