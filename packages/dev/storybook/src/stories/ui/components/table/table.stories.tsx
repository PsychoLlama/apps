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
  type TableSize,
  type TableVariant,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = [
  'surface',
  'ghost',
] as const satisfies ReadonlyArray<TableVariant>;
const SIZES = [1, 2, 3] as const satisfies ReadonlyArray<TableSize>;

interface Row {
  name: string;
  email: string;
  role: string;
  status: string;
}

const ROWS: Row[] = [
  {
    name: 'Gill Bates',
    email: 'gill@microhard.example',
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
        <TableColumnHeaderCell>Full name</TableColumnHeaderCell>
        <TableColumnHeaderCell>Email</TableColumnHeaderCell>
        <TableColumnHeaderCell>Role</TableColumnHeaderCell>
        <TableColumnHeaderCell justify="end">Status</TableColumnHeaderCell>
      </TableRow>
    </TableHeader>
    <TableBody>
      <For each={ROWS}>
        {(row) => (
          <TableRow>
            <TableRowHeaderCell>{row.name}</TableRowHeaderCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell justify="end">{row.status}</TableCell>
          </TableRow>
        )}
      </For>
    </TableBody>
  </TableRoot>
);

const meta = {
  title: 'UI/Components/Table',
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Demo variant={variant} />),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} variant="surface" />),
    },
  ],
});

export const Playground: Story = {};
