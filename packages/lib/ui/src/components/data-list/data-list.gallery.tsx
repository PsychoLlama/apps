import type { GalleryListing } from '@dev/gallery';
import {
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  type DataListColor,
  type DataListOrientation,
  type DataListRootProps,
} from './data-list';

const ORIENTATIONS = [
  'horizontal',
  'vertical',
] as const satisfies ReadonlyArray<DataListOrientation>;
const COLORS = [
  'accent',
  'neutral',
  'danger',
  'warning',
  'success',
] as const satisfies ReadonlyArray<DataListColor>;

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
      columns: ORIENTATIONS.map((orientation) => ({
        title: orientation,
        props: { orientation },
      })),
    },
    {
      title: 'Label color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { labelColor: color },
      })),
    },
  ],
} satisfies GalleryListing<DataListRootProps & { labelColor?: DataListColor }>;
