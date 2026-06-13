import type { GalleryListing } from '@dev/gallery';
import IconHeart from 'virtual:icons/mdi/heart';
import IconButton, { type IconButtonProps } from './icon-button';

/**
 * Gallery listing for `IconButton`. Enumerates the component across its
 * visual axes. `IconButtonProps` is a union over its labelling props; pin the
 * `aria-label` arm so `Partial<P>` keeps the full prop set.
 */
export default {
  title: 'IconButton',
  render: (props) => (
    <IconButton aria-label="Like" testId="icon-button" {...props}>
      <IconHeart />
    </IconButton>
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Outline', props: { variant: 'outline' } },
        { title: 'Ghost', props: { variant: 'ghost' } },
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
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
  ],
} satisfies GalleryListing<Extract<IconButtonProps, { 'aria-label': string }>>;
