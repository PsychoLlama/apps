import type { GalleryListing } from '@lib/gallery';
import Avatar, { type AvatarProps } from './avatar';
import SAMPLE_SRC from './sample-avatar.svg?url';

// The error cell uses a guaranteed-broken URL to exercise the fallback
// path; the loaded cell uses a bundled SVG so the gallery renders without
// a network.
const BROKEN_SRC = 'https://example.invalid/avatar.png';

/**
 * Gallery listing for `Avatar`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Avatar',
  render: (props) => <Avatar alt="Gill Bates" fallback="GB" {...props} />,
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
      rows: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent', variant: 'solid' } },
        { title: 'Neutral', props: { color: 'neutral', variant: 'solid' } },
        { title: 'Danger', props: { color: 'danger', variant: 'solid' } },
        { title: 'Warning', props: { color: 'warning', variant: 'solid' } },
        { title: 'Success', props: { color: 'success', variant: 'solid' } },
      ],
    },
    {
      title: 'State',
      columns: [
        { title: 'Image', props: { src: SAMPLE_SRC } },
        { title: 'Broken', props: { src: BROKEN_SRC } },
        { title: 'Fallback', props: {} },
      ],
    },
  ],
} satisfies GalleryListing<AvatarProps>;
