import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Avatar from './avatar';
import SAMPLE_SRC from './sample-avatar.svg?url';

const VARIANTS = ['solid', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

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
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, variant: 'solid' },
      })),
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({ title: radius, props: { radius } })),
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
} satisfies GalleryListing<ComponentProps<typeof Avatar>>;
