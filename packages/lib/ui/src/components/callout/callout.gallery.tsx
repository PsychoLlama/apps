import type { GalleryListing } from '@dev/gallery';
import Callout, { type CalloutProps } from './callout';
import Text from '../text/text';

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
  render: (props) => <Callout {...props} />,
  sections: [
    {
      title: 'Theme colors',
      columns: [
        {
          title: 'Soft',
          props: { variant: 'soft', children: <Body label={`soft callout`} /> },
        },
        {
          title: 'Surface',
          props: {
            variant: 'surface',
            children: <Body label={`surface callout`} />,
          },
        },
        {
          title: 'Outline',
          props: {
            variant: 'outline',
            children: <Body label={`outline callout`} />,
          },
        },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'High contrast', props: { highContrast: true } },
      ],
    },
    {
      title: 'Color',
      columns: [
        {
          title: 'Accent',
          props: {
            color: 'accent',
            children: <Body label={`accent callout`} />,
          },
        },
        {
          title: 'Neutral',
          props: {
            color: 'neutral',
            children: <Body label={`neutral callout`} />,
          },
        },
        {
          title: 'Danger',
          props: {
            color: 'danger',
            children: <Body label={`danger callout`} />,
          },
        },
        {
          title: 'Warning',
          props: {
            color: 'warning',
            children: <Body label={`warning callout`} />,
          },
        },
        {
          title: 'Success',
          props: {
            color: 'success',
            children: <Body label={`success callout`} />,
          },
        },
      ],
    },
  ],
} satisfies GalleryListing<CalloutProps>;
