import { createSignal, untrack } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Slider, { type SliderProps } from './slider';
import Flex from '../flex/flex';
import * as css from './slider.gallery.css';

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
      title: 'Theme colors',
      columns: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
      rows: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
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
