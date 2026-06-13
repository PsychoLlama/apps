import { createSignal, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Slider, { type SliderProps } from './slider';
import Flex from '../flex/flex';
import * as css from './slider.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

type DemoProps = Partial<SliderProps> & { initialValue?: number[] };

const Demo = (props: DemoProps) => {
  const [value, setValue] = createSignal(
    untrack(() => props.initialValue ?? [40]),
  );
  return (
    <Flex as="div" class={css.galleryCell}>
      <Slider
        {...props}
        value={value()}
        onValueChange={setValue}
        testId="slider"
      />
    </Flex>
  );
};

/**
 * Gallery listing for `Slider`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Slider',
  render: (props) => <Demo {...props} />,
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
      title: 'Radius',
      columns: RADII.map((radius) => ({ title: radius, props: { radius } })),
    },
    {
      title: 'Range',
      columns: [
        { title: 'Two thumbs', props: { initialValue: [20, 80] } },
        { title: 'Three thumbs', props: { initialValue: [10, 50, 90] } },
      ],
    },
    {
      title: 'State',
      columns: [
        { title: 'Default', props: { initialValue: [50] } },
        { title: 'Disabled', props: { initialValue: [50], disabled: true } },
        {
          title: 'Disabled range',
          props: { initialValue: [20, 80], disabled: true },
        },
      ],
    },
  ],
} satisfies GalleryListing<SliderProps & { initialValue?: number[] }>;
