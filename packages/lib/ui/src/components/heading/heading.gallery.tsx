import type { Listing } from '#gallery';
import type { TypeScale } from '@lib/design';
import Heading, { type HeadingProps } from './heading';

const SAMPLE = 'Account settings';

/** Type-scale steps, smallest to largest. */
const sizes: ReadonlyArray<TypeScale> = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Gallery listing for `Heading`. Enumerates the component across its visual
 * axes — size is independent of the heading level, so each section varies the
 * visual facet rather than the `as` tag.
 */
export default {
  title: 'Heading',
  group: 'typography',
  render: (props) => (
    <Heading as="h2" selectable {...props}>
      {SAMPLE}
    </Heading>
  ),
  sections: [
    {
      title: 'Color',
      columns: [
        { title: 'High contrast', props: { color: 'highContrast' } },
        { title: 'Low contrast', props: { color: 'lowContrast' } },
      ],
    },
    {
      title: 'Weight',
      rows: [
        { title: 'Light', props: { weight: 'light' } },
        { title: 'Regular', props: { weight: 'regular' } },
        { title: 'Medium', props: { weight: 'medium' } },
        { title: 'Bold', props: { weight: 'bold' } },
      ],
    },
    {
      title: 'Size',
      align: { rows: 'center' },
      rows: sizes.map((size) => ({ title: `${size}`, props: { size } })),
    },
  ],
} satisfies Listing<HeadingProps<'h2'>>;
