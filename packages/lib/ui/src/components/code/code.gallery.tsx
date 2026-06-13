import type { GalleryListing } from '@dev/gallery';
import Code, { type CodeProps } from './code';

/**
 * Gallery listing for `Code`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Code',
  render: (props) => <Code {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: [
        { title: 'Solid', props: { variant: 'solid', children: 'solid' } },
        { title: 'Soft', props: { variant: 'soft', children: 'soft' } },
        {
          title: 'Outline',
          props: { variant: 'outline', children: 'outline' },
        },
        { title: 'Ghost', props: { variant: 'ghost', children: 'ghost' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent', children: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral', children: 'neutral' } },
        { title: 'Danger', props: { color: 'danger', children: 'danger' } },
        { title: 'Warning', props: { color: 'warning', children: 'warning' } },
        { title: 'Success', props: { color: 'success', children: 'success' } },
      ],
    },
  ],
} satisfies GalleryListing<CodeProps>;
