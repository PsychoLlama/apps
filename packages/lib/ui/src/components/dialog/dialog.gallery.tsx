import { createSignal, For, Match, Switch } from 'solid-js';
import type { Listing } from '#gallery';
import Button from '../button/button';
import Flex from '../flex/flex';
import Heading from '../heading/heading';
import Inset from '../inset/inset';
import {
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRoot,
  TableRow,
  TableRowHeaderCell,
} from '../table/table';
import Text from '../text/text';
import TextField from '../text-field/text-field';
import Dialog, { type DialogProps } from './dialog';

const MEMBERS = [
  { name: 'Paige Turner', email: 'paige@publishing.example', role: 'Owner' },
  { name: 'Gill Bates', email: 'gill@macrohard.example', role: 'Admin' },
  { name: 'Anna Graham', email: 'anna@boardgames.example', role: 'Editor' },
  { name: 'Thomas Hawking', email: 'thomas@axis.example', role: 'Editor' },
  { name: 'Bob Robertson', email: 'bob@robertson.example', role: 'Viewer' },
];

/**
 * Long-form copy for the scrolling demo. Deliberately taller than a
 * generous viewport — the panel has no max height, so overflow is the
 * only thing that puts the scroll surface to work.
 */
const TERMS = [
  {
    title: 'Roles and inheritance',
    body: 'Members inherit the workspace role unless a project role is granted here. Project roles always win, including where they grant less access than the workspace role.',
  },
  {
    title: 'Guests',
    body: 'Guests reach only the projects they are named on. They cannot see the member directory, billing, or any workspace-level setting.',
  },
  {
    title: 'Revocation',
    body: 'Removing a member revokes their access immediately, including active sessions and personal API tokens. Tokens owned by the project keep working.',
  },
  {
    title: 'Audit logging',
    body: 'Every grant, change, and revocation is recorded with the acting member and a timestamp. Workspace owners see the entry within a few minutes.',
  },
  {
    title: 'Invitations',
    body: 'An invitation is valid for seven days and can be used once. Re-sending an invitation invalidates the previous link.',
  },
  {
    title: 'Domain capture',
    body: 'Anyone signing up with a verified company domain joins the workspace automatically at the default role. Capture can be turned off per domain.',
  },
  {
    title: 'Service accounts',
    body: 'Service accounts hold project roles like any other member, but cannot be invited to a workspace or granted ownership.',
  },
  {
    title: 'Transfers',
    body: 'Moving a project between workspaces drops every project role. Grant them again in the destination workspace once the transfer settles.',
  },
  {
    title: 'Data residency',
    body: 'Project data stays in the region chosen at creation. Access records are replicated globally so the audit log survives a regional outage.',
  },
  {
    title: 'Retention',
    body: 'Revoked grants stay in the audit log for two years. The member record itself is deleted thirty days after the last grant is removed.',
  },
  {
    title: 'Exports',
    body: 'Owners can export the full access list as CSV. The export reflects the moment it was requested and is not kept on our side.',
  },
  {
    title: 'Enforcement',
    body: 'Access checks run on every request. A revoked grant takes effect before the next request completes, without waiting for a session to expire.',
  },
  {
    title: 'Break-glass access',
    body: 'Support staff can be granted time-boxed access by an owner. The grant expires on its own and cannot be renewed silently.',
  },
  {
    title: 'Appeals',
    body: 'A member who loses access can ask an owner to review it. Owners see the originating audit entry alongside the request.',
  },
  {
    title: 'Session limits',
    body: 'A session lasts thirty days of continuous use. Idle sessions expire after seven, and changing a role ends every session it applied to.',
  },
  {
    title: 'Device trust',
    body: 'Workspaces on the enterprise plan can require a managed device for owner and admin roles. Other roles are unaffected.',
  },
  {
    title: 'Notifications',
    body: 'Members are emailed when they gain or lose a project role. Owners can suppress the notice for bulk changes during onboarding.',
  },
];

/** Which body the demo renders under the header. */
type DemoBody = 'confirm' | 'form' | 'table' | 'terms';

type DemoProps = Partial<DialogProps> & {
  /** Seeds the demo's test ids. Each cell needs its own. */
  name: string;
  /** Which body to render. @default 'confirm' */
  body?: DemoBody;
};

/** Cancel / confirm pair, closing on either. */
const Actions = (props: {
  name: string;
  confirm: string;
  close: () => void;
}) => (
  <Flex as="div" justify="end" gap={3}>
    <Button
      as="button"
      variant="soft"
      color="neutral"
      testId={`${props.name}-cancel`}
      onClick={props.close}
    >
      Cancel
    </Button>
    <Button as="button" testId={`${props.name}-confirm`} onClick={props.close}>
      {props.confirm}
    </Button>
  </Flex>
);

/**
 * A dialog can only be shown one at a time, so each cell renders an
 * opener rather than the surface itself.
 */
const Demo = (props: DemoProps) => {
  const [open, setOpen] = createSignal(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        as="button"
        variant="soft"
        color="neutral"
        testId={`${props.name}-trigger`}
        onClick={() => setOpen(true)}
      >
        Show dialog
      </Button>

      <Dialog
        open={open()}
        onOpenChange={setOpen}
        title={props.title ?? 'Manage project access'}
        description={
          props.description ??
          'Members inherit the workspace role unless you grant them a project role here.'
        }
        size={props.size}
        align={props.align}
        dismissal={props.dismissal}
        maxWidth={props.maxWidth}
        testId={props.name}
      >
        <Flex as="div" direction="column" gap={4}>
          <Switch>
            <Match when={props.body === 'form'}>
              <TextField
                type="email"
                placeholder="ada@example.com"
                autocomplete="email"
                autocapitalize="off"
                enterkeyhint="send"
                testId={`${props.name}-email`}
              />
            </Match>

            {/* `side="x"` bleeds the table to the panel edges while the
                header and actions keep their padding. */}
            <Match when={props.body === 'table'}>
              <Inset as="div" side="x">
                <TableRoot variant="ghost" testId={`${props.name}-table`}>
                  <TableHeader>
                    <TableRow>
                      <TableColumnHeaderCell selectable={false}>
                        Member
                      </TableColumnHeaderCell>
                      <TableColumnHeaderCell selectable={false} justify="end">
                        Role
                      </TableColumnHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={MEMBERS}>
                      {(member) => (
                        <TableRow>
                          <TableRowHeaderCell selectable>
                            {member.email}
                          </TableRowHeaderCell>
                          <TableCell selectable={false} justify="end">
                            {member.role}
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </TableRoot>
              </Inset>
            </Match>

            <Match when={props.body === 'terms'}>
              <Flex as="div" direction="column" gap={4}>
                <For each={TERMS}>
                  {(term) => (
                    <Flex as="section" direction="column" gap={1}>
                      <Heading as="h3" size={3} selectable>
                        {term.title}
                      </Heading>
                      <Text as="p" size={2} selectable>
                        {term.body}
                      </Text>
                    </Flex>
                  )}
                </For>
              </Flex>
            </Match>
          </Switch>

          <Actions
            name={props.name}
            confirm={props.body === 'form' ? 'Invite' : 'Save'}
            close={close}
          />
        </Flex>
      </Dialog>
    </>
  );
};

/**
 * Gallery listing for `Dialog`. Every cell is an opener — the surface
 * itself is modal, so only one can be on screen at a time.
 */
export default {
  title: 'Dialog',
  group: 'display',
  render: (props) => <Demo name="dialog" {...props} />,
  sections: [
    {
      title: 'Alignment',
      align: { rows: 'center' },
      rows: [
        { title: 'Center', props: { align: 'center', name: 'align-center' } },
        { title: 'Start', props: { align: 'start', name: 'align-start' } },
      ],
    },
    {
      title: 'Content',
      align: { rows: 'center' },
      rows: [
        { title: 'Confirmation', props: { name: 'content-confirm' } },
        {
          title: 'Form',
          props: {
            title: 'Invite a teammate',
            description: 'They will get an email with a join link.',
            body: 'form',
            name: 'content-form',
          },
        },
        {
          title: 'Inset table',
          props: {
            title: 'Project members',
            description: 'Everyone holding a role on Northwind.',
            body: 'table',
            name: 'content-table',
          },
        },
        {
          title: 'Scrolling',
          props: {
            title: 'Access policy',
            description: 'How roles are granted, inherited, and revoked.',
            body: 'terms',
            name: 'content-terms',
          },
        },
      ],
    },
    {
      title: 'Behavior',
      align: { rows: 'center' },
      rows: [
        {
          title: 'Dismissible',
          props: { dismissal: 'any', name: 'behavior-dismissible' },
        },
        {
          title: 'Escape only',
          props: {
            title: 'Invite teammates',
            description:
              'An outside click is inert, so a stray one cannot lose the form.',
            dismissal: 'escape',
            name: 'behavior-escape',
          },
        },
        {
          title: 'Locked',
          props: {
            title: 'Unsaved changes',
            description:
              'Escape and outside clicks are off, so this has to end in a choice.',
            dismissal: 'none',
            name: 'behavior-locked',
          },
        },
        {
          title: 'Narrow',
          props: { maxWidth: '360px', name: 'behavior-narrow' },
        },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
