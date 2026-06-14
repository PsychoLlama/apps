import { For } from 'solid-js';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRoot,
  type TableRootProps,
  TableRow,
  TableRowHeaderCell,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

interface Row {
  name: string;
  email: string;
  role: string;
  status: string;
}

const ROWS: Row[] = [
  {
    name: 'Gill Bates',
    email: 'gill@macrohard.example',
    role: 'Admin',
    status: 'Active',
  },
  {
    name: 'Thomas Hawking',
    email: 'thomas@blackholes.example',
    role: 'Editor',
    status: 'Invited',
  },
  {
    name: 'Mary Curry',
    email: 'mary@radium.example',
    role: 'Viewer',
    status: 'Active',
  },
  {
    name: 'Ada Loveless',
    email: 'ada@analytical.example',
    role: 'Owner',
    status: 'Active',
  },
  {
    name: 'Bob Robertson',
    email: 'bob@robertson.example',
    role: 'Editor',
    status: 'Active',
  },
  {
    name: 'Jonathan Johnson',
    email: 'jonathan@johnson.example',
    role: 'Viewer',
    status: 'Invited',
  },
];

const Demo = (props: Partial<TableRootProps>) => (
  <TableRoot {...props}>
    <TableHeader>
      <TableRow>
        <TableColumnHeaderCell selectable={false}>
          Full name
        </TableColumnHeaderCell>
        <TableColumnHeaderCell selectable={false}>Email</TableColumnHeaderCell>
        <TableColumnHeaderCell selectable={false}>Role</TableColumnHeaderCell>
        <TableColumnHeaderCell selectable={false} justify="end">
          Status
        </TableColumnHeaderCell>
      </TableRow>
    </TableHeader>
    <TableBody>
      <For each={ROWS}>
        {(row) => (
          <TableRow>
            <TableRowHeaderCell selectable={true}>
              {row.name}
            </TableRowHeaderCell>
            <TableCell selectable={true}>{row.email}</TableCell>
            <TableCell selectable={false}>{row.role}</TableCell>
            <TableCell selectable={false} justify="end">
              {row.status}
            </TableCell>
          </TableRow>
        )}
      </For>
    </TableBody>
  </TableRoot>
);

const meta = {
  title: 'UI/Components',
  component: TableRoot,
  args: {
    testId: 'table',
    size: 2,
    variant: 'surface',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['surface', 'ghost'],
    },
    layout: {
      control: 'inline-radio',
      options: ['auto', 'fixed'],
    },
  },
  render: (props: TableRootProps) => <Demo {...props} />,
} satisfies Meta<TableRootProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Table: Story = {};
