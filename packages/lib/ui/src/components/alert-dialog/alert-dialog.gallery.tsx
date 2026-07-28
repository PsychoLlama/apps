import { createSignal, For, Match, Switch } from 'solid-js';
import type { Listing } from '#gallery';
import AlertDialog, { type AlertDialogProps } from './alert-dialog';
import Button from '../button/button';
import Flex from '../flex/flex';
import Text from '../text/text';
import TextField from '../text-field/text-field';

/** What Northwind loses when the project goes. */
const CASUALTIES = [
  '412 documents, including every revision',
  '3 published sites and their custom domains',
  'API tokens owned by the project',
  'Two years of audit history',
];

/** Which body the demo renders between the description and the buttons. */
type DemoBody = 'none' | 'detail' | 'confirm';

type DemoProps = Partial<AlertDialogProps> & {
  /** Seeds the demo's test ids. Each cell needs its own. */
  name: string;
  /** Which body to render. @default 'none' */
  body?: DemoBody;
};

/**
 * A modal can only be shown one at a time, so each cell renders an
 * opener rather than the surface itself.
 */
const Demo = (props: DemoProps) => {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <Button
        as="button"
        variant="soft"
        color="neutral"
        testId={`${props.name}-trigger`}
        onClick={() => setOpen(true)}
      >
        Show alert
      </Button>

      <AlertDialog
        open={open()}
        onOpenChange={setOpen}
        onAction={() => {}}
        title={props.title ?? 'Delete project'}
        description={
          props.description ??
          'Northwind and everything in it is removed for good. This cannot be undone.'
        }
        action={props.action ?? 'Delete project'}
        cancel={props.cancel}
        color={props.color ?? 'danger'}
        size={props.size}
        align={props.align}
        maxWidth={props.maxWidth}
        testId={props.name}
      >
        <Switch>
          <Match when={props.body === 'detail'}>
            <Flex as="ul" direction="column" gap={1}>
              <For each={CASUALTIES}>
                {(item) => (
                  <li>
                    <Text as="span" size={2} selectable>
                      {item}
                    </Text>
                  </li>
                )}
              </For>
            </Flex>
          </Match>

          {/* The body is focusable, but `autofocus` on Cancel still
              wins — a stray Enter can't confirm. */}
          <Match when={props.body === 'confirm'}>
            <TextField
              placeholder="NORTHWIND"
              autocomplete="off"
              autocapitalize="characters"
              enterkeyhint="done"
              testId={`${props.name}-field`}
            />
          </Match>
        </Switch>
      </AlertDialog>
    </>
  );
};

/**
 * Gallery listing for `AlertDialog`. Every cell is an opener — the
 * surface itself is modal, so only one can be on screen at a time.
 */
export default {
  title: 'AlertDialog',
  group: 'display',
  render: (props) => <Demo name="alert-dialog" {...props} />,
  sections: [
    {
      title: 'Tone',
      align: { rows: 'center' },
      rows: [
        {
          title: 'Accent',
          props: {
            color: 'accent',
            title: 'Publish changes',
            description:
              'Northwind goes live for everyone in the workspace right away.',
            action: 'Publish',
            name: 'tone-accent',
          },
        },
        {
          title: 'Neutral',
          props: {
            color: 'neutral',
            title: 'Sign out everywhere',
            description:
              'Every session on every device ends. You will have to sign in again.',
            action: 'Sign out',
            name: 'tone-neutral',
          },
        },
        {
          title: 'Danger',
          props: { color: 'danger', name: 'tone-danger' },
        },
        {
          title: 'Warning',
          props: {
            color: 'warning',
            title: 'Overwrite the saved draft',
            description:
              'The draft from Tuesday is replaced by what is on screen now.',
            action: 'Overwrite',
            name: 'tone-warning',
          },
        },
        {
          title: 'Success',
          props: {
            color: 'success',
            title: 'Approve access request',
            description:
              'Ada gets editor access to Northwind and an email saying so.',
            action: 'Approve',
            name: 'tone-success',
          },
        },
      ],
    },
    {
      title: 'Content',
      align: { rows: 'center' },
      rows: [
        { title: 'Bare', props: { name: 'content-bare' } },
        {
          title: 'With detail',
          props: {
            description: 'Deleting Northwind takes the following with it.',
            body: 'detail',
            name: 'content-detail',
          },
        },
        {
          title: 'Type to confirm',
          props: {
            description:
              'Type the project name to confirm. This cannot be undone.',
            body: 'confirm',
            name: 'content-confirm',
          },
        },
        {
          title: 'Custom cancel',
          props: { cancel: 'Keep the project', name: 'content-cancel' },
        },
      ],
    },
    {
      title: 'Panel',
      align: { rows: 'center' },
      rows: [
        { title: 'Compact', props: { size: 1, name: 'panel-compact' } },
        { title: 'Roomy', props: { size: 4, name: 'panel-roomy' } },
        { title: 'Wide', props: { maxWidth: '640px', name: 'panel-wide' } },
        {
          title: 'Top-aligned',
          props: { align: 'start', name: 'panel-start' },
        },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
