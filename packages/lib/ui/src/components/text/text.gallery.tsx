import type { Listing } from '#gallery';
import type { TypeScale } from '@lib/design';
import Text, { type TextProps } from './text';

const SAMPLE = 'Manage your account settings and preferences.';

/** Type-scale steps, smallest to largest. */
const sizes: ReadonlyArray<TypeScale> = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Gallery listing for `Text`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Text',
  group: 'typography',
  render: (props) => (
    <Text as="p" selectable {...props}>
      {SAMPLE}
    </Text>
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
} satisfies Listing<TextProps<'p'>>;
