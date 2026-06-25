import type { Listing } from '#gallery';
import Section, { type SectionProps } from './section';
import * as css from './section.gallery.css';

/** Renders placeholder content wrapped in a section's vertical padding. */
const Demo = (props: Partial<SectionProps>) => (
  <Section {...props} class={css.frame}>
    <div class={css.content} />
  </Section>
);

/**
 * Gallery listing for `Section`. Enumerates the vertical padding presets —
 * the taller the surface, the more block-axis rhythm the size adds.
 */
export default {
  title: 'Section',
  group: 'layout',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Size',
      columns: [
        { title: '1', props: { size: 1 } },
        { title: '2', props: { size: 2 } },
        { title: '3', props: { size: 3 } },
        { title: '4', props: { size: 4 } },
      ],
    },
  ],
} satisfies Listing<SectionProps>;
