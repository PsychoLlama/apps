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
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Avatar alt="Gill Bates" fallback="GB" variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Avatar alt="Gill Bates" fallback="GB" color={color} variant="solid" />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Avatar alt="Gill Bates" fallback="GB" radius={radius} />
      )),
    },
    {
      title: 'State',
      items: [
        <Avatar alt="Gill Bates" fallback="GB" src={SAMPLE_SRC} />,
        <Avatar alt="Gill Bates" fallback="GB" src={BROKEN_SRC} />,
        <Avatar alt="Gill Bates" fallback="GB" />,
      ],
    },
  ],
} satisfies GalleryListing;
