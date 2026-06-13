import { createSignal, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Slider, { type SliderProps } from './slider';
import Flex from '../flex/flex';
import * as css from './slider.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const Demo = (props: Partial<SliderProps> & { initialValue?: number[] }) => {
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
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'Range',
      items: [
        <Demo initialValue={[20, 80]} />,
        <Demo initialValue={[10, 50, 90]} />,
      ],
    },
    {
      title: 'State',
      items: [
        <Demo initialValue={[50]} />,
        <Demo initialValue={[50]} disabled />,
        <Demo initialValue={[20, 80]} disabled />,
      ],
    },
  ],
} satisfies GalleryListing;
