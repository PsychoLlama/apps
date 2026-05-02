import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  type DataListColor,
  type DataListOrientation,
  type DataListRootProps,
  type DataListSize,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { trimArgTypes } from '@lib/ui/props/trim';
import { gallery } from '../../../../gallery';

const ORIENTATIONS = [
  'horizontal',
  'vertical',
] as const satisfies ReadonlyArray<DataListOrientation>;
const SIZES = [1, 2, 3] as const satisfies ReadonlyArray<DataListSize>;
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
      <DataListValue>Authorized</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel>ID</DataListLabel>
      <DataListValue>u_2N4o…f3kQ</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel>Email</DataListLabel>
      <DataListValue>vlad@workos.com</DataListValue>
    </DataListItem>
    <DataListItem>
      <DataListLabel>Plan</DataListLabel>
      <DataListValue>Pro</DataListValue>
    </DataListItem>
  </DataListRoot>
);

const meta = {
  title: 'UI/Components/DataList',
  component: DataListRoot,
  args: {
    testId: 'data-list',
    orientation: 'horizontal',
    size: 2,
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    ...trimArgTypes,
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
  },
  render: (props: DataListRootProps) => (
    <DataListRoot {...props}>
      <DataListItem>
        <DataListLabel>Status</DataListLabel>
        <DataListValue>Authorized</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>ID</DataListLabel>
        <DataListValue>u_2N4o…f3kQ</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Name</DataListLabel>
        <DataListValue>Vlad Moroz</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Email</DataListLabel>
        <DataListValue>vlad@workos.com</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Company</DataListLabel>
        <DataListValue>WorkOS</DataListValue>
      </DataListItem>
    </DataListRoot>
  ),
} satisfies Meta<DataListRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Orientation',
      items: ORIENTATIONS.map((orientation) => (
        <Demo orientation={orientation} />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
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
});

export const Playground: Story = {};
