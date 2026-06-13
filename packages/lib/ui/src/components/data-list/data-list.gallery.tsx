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

const Demo = (props: Partial<DataListRootProps>) => (
  <DataListRoot {...props}>
    <DataListItem>
      <DataListLabel>Status</DataListLabel>
      <DataListValue>Hatched</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel>ID</DataListLabel>
      <DataListValue>egg_4f7c…a19b</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel>Species</DataListLabel>
      <DataListValue>Emperor penguin</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel>Mass</DataListLabel>
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
  sections: [
    {
      title: 'Orientation',
      items: ORIENTATIONS.map((orientation) => (
        <Demo orientation={orientation} />
      )),
    },
    {
      title: 'Label color',
      items: COLORS.map((color) => (
        <DataListRoot>
          <DataListItem>
            <DataListLabel color={color}>{color}</DataListLabel>
            <DataListValue>Tinted label</DataListValue>
          </DataListItem>
          <DataListItem>
            <DataListLabel color={color}>Status</DataListLabel>
            <DataListValue>Active</DataListValue>
          </DataListItem>
        </DataListRoot>
      )),
    },
  ],
} satisfies GalleryListing;
