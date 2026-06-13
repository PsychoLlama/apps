import { createSignal, For } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  RadioCardsItem,
  RadioCardsRoot,
  type RadioCardsRootProps,
} from './radio-cards';

const VARIANTS = ['surface', 'classic'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const OPTIONS = [1, 2] as const;

/**
 * Each gallery cell echoes the demoed axis value in its card labels via the
 * `label` prefix when the value isn't already obvious from the visual
 * treatment. `name` keeps each group's radios isolated. The second card is
 * preselected so the checked + indicator color shows up directly.
 */
type DemoProps = Partial<RadioCardsRootProps> & {
  name?: string;
  label?: string;
};

const Demo = (props: { name: string } & DemoProps) => {
  const [value, setValue] = createSignal<string | null>('2');
  return (
    <RadioCardsRoot
      name={props.name}
      value={value()}
      onValueChange={setValue}
      size={props.size}
      variant={props.variant}
      color={props.color}
      disabled={props.disabled}
      columns={2}
      testId={props.name}
    >
      <For each={OPTIONS}>
        {(option) => (
          <RadioCardsItem
            value={String(option)}
            testId={`${props.name}-${option}`}
          >
            {props.label ? `${props.label} ${option}` : option}
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );
};

/**
 * Gallery listing for `RadioCards`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'RadioCards',
  render: (props) => <Demo {...props} name={props.name ?? 'radio-cards'} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, label: variant, name: `variant-${variant}` },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, label: color, name: `color-${color}` },
      })),
    },
    {
      title: 'Disabled',
      columns: [
        { title: 'Disabled', props: { disabled: true, name: 'disabled' } },
      ],
    },
  ],
} satisfies GalleryListing<DemoProps>;
