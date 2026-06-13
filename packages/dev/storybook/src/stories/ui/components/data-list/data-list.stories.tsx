import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  type DataListRootProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { trimArgTypes } from '@lib/ui/props/trim';

const meta = {
  title: 'UI/Components',
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
        <DataListValue>Active</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>ID</DataListLabel>
        <DataListValue>usr_9k2x…d4mn</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Name</DataListLabel>
        <DataListValue>Gill Bates</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Email</DataListLabel>
        <DataListValue>gill@microhard.example</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Reports to</DataListLabel>
        <DataListValue>Thomas Hawking</DataListValue>
      </DataListItem>
    </DataListRoot>
  ),
} satisfies Meta<DataListRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataList: Story = {};
