import type { GalleryListing } from '@lib/gallery';
import {
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  type DataListColor,
  type DataListRootProps,
} from './data-list';
import Badge from '../badge/badge';

/** The label color is per-`DataListLabel`, so it rides an extra demo-only prop. */
type DemoProps = Partial<DataListRootProps> & { labelColor?: DataListColor };

const Demo = (props: DemoProps) => (
  <DataListRoot orientation={props.orientation}>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Name</DataListLabel>
      <DataListValue>Gill Bates</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Email</DataListLabel>
      <DataListValue>gill@macrohard.example</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Reports to</DataListLabel>
      <DataListValue>Bob Robertson</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel color={props.labelColor}>Status</DataListLabel>
      <DataListValue>
        <Badge color="neutral">Active</Badge>
      </DataListValue>
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
        { title: 'Vertical', props: { orientation: 'vertical' } },
        { title: 'Horizontal', props: { orientation: 'horizontal' } },
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
