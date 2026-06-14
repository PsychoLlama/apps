import type { GalleryListing } from '@dev/gallery';
import Callout, { type CalloutProps } from './callout';
import Text from '../text/text';

const SAMPLE = 'Your changes have been saved.';

const Body = (props: { label: string }) => (
  <Text as="p" size={2} selectable>
    {props.label}
  </Text>
);

/**
 * Gallery listing for `Callout`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Callout',
  render: (props) => (
    <Callout {...props}>
      <Body label={SAMPLE} />
    </Callout>
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Soft', props: { variant: 'soft' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Outline', props: { variant: 'outline' } },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'High contrast', props: { highContrast: true } },
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
} satisfies GalleryListing<CalloutProps>;
