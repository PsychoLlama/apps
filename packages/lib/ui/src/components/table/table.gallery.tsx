import { For } from 'solid-js';
import type { Listing } from '#gallery';
import {
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRoot,
  type TableRootProps,
  TableRow,
  TableRowHeaderCell,
} from './table';

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
    email: 'thomas@axis.example',
    role: 'Editor',
    status: 'Invited',
  },
  {
    name: 'Anna Graham',
    email: 'anna@boardgames.example',
    role: 'Viewer',
    status: 'Active',
  },
  {
    name: 'Paige Turner',
    email: 'paige@publishing.example',
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

/**
 * Gallery listing for `Table`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Table',
  group: 'display',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: [
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Ghost', props: { variant: 'ghost' } },
      ],
    },
  ],
} satisfies Listing<TableRootProps>;
