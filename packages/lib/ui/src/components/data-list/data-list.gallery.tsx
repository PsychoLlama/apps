import type { GalleryListing } from '@dev/gallery';
import {
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  type DataListColor,
  type DataListRootProps,
} from './data-list';

/** The label color is per-`DataListLabel`, so it rides an extra demo-only prop. */
type DemoProps = Partial<DataListRootProps> & { labelColor?: DataListColor };

const Demo = (props: DemoProps) => (
  <DataListRoot orientation={props.orientation}>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Status</DataListLabel>
      <DataListValue>Hatched</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel color={props.labelColor}>ID</DataListLabel>
      <DataListValue>egg_4f7c…a19b</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Species</DataListLabel>
      <DataListValue>Emperor penguin</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Mass</DataListLabel>
      <DataListValue>23 kg</DataListValue>
    </DataListItem>
  </DataListRoot>
);

/**
 * Gallery listing for `DataList`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'DataList',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Orientation',
      columns: [
        { title: 'Horizontal', props: { orientation: 'horizontal' } },
        { title: 'Vertical', props: { orientation: 'vertical' } },
      ],
    },
    {
      title: 'Label color',
      columns: [
        { title: 'Accent', props: { labelColor: 'accent' } },
        { title: 'Neutral', props: { labelColor: 'neutral' } },
        { title: 'Danger', props: { labelColor: 'danger' } },
        { title: 'Warning', props: { labelColor: 'warning' } },
        { title: 'Success', props: { labelColor: 'success' } },
      ],
    },
  ],
} satisfies GalleryListing<DataListRootProps & { labelColor?: DataListColor }>;
