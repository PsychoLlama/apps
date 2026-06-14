import type { GalleryListing } from '@dev/gallery';
import Code, { type CodeProps } from './code';

/**
 * Gallery listing for `Code`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Code',
  render: (props) => <Code {...props}>npm install</Code>,
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
        { title: 'Outline', props: { variant: 'outline' } },
        { title: 'Ghost', props: { variant: 'ghost' } },
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
  ],
} satisfies GalleryListing<CodeProps>;
