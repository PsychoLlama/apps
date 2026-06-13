import { For } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import {
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRoot,
  type TableRootProps,
  TableRow,
  TableRowHeaderCell,
  type TableVariant,
} from './table';

const VARIANTS = [
  'surface',
  'ghost',
] as const satisfies ReadonlyArray<TableVariant>;

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
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Demo variant={variant} />),
    },
  ],
} satisfies GalleryListing;
