import { createSignal, For, Show } from 'solid-js';
import type { Listing } from '#gallery';
import Button from '../button/button';
import Flex from '../flex/flex';
import Text from '../text/text';
import TextField from '../text-field/text-field';
import Dialog, { type DialogProps } from './dialog';

const PARAGRAPHS = [
  'Members inherit the workspace role unless you grant them a project role here. Project roles always win.',
  'Removing a member revokes their access immediately, including any active sessions and personal API tokens.',
  'Changes are recorded in the audit log and surface to workspace owners within a few minutes.',
];

type DemoProps = Partial<DialogProps> & {
  /** Seeds the demo's test ids. Each cell needs its own. */
  name: string;
  /** Label on the opener. */
  label?: string;
  /** Render a form body instead of the default confirmation buttons. */
  form?: boolean;
  /** Pad the body until it outgrows the viewport, to show scrolling. */
  long?: boolean;
};

/**
 * A dialog can only be shown one at a time, so each cell renders an
 * opener rather than the surface itself.
 */
const Demo = (props: DemoProps) => {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <Button
        as="button"
        variant="soft"
        testId={`${props.name}-trigger`}
        onClick={() => setOpen(true)}
      >
        {props.label ?? 'Manage access'}
      </Button>

      <Dialog
        open={open()}
        onOpenChange={setOpen}
        title={props.title ?? 'Manage project access'}
        description={props.description}
        size={props.size}
        align={props.align}
        dismissible={props.dismissible}
        maxWidth={props.maxWidth}
        testId={props.name}
      >
        <Show
          when={props.form}
          fallback={
            <Flex as="div" direction="column" gap={3}>
              <Show when={props.long}>
                <For each={[...PARAGRAPHS, ...PARAGRAPHS, ...PARAGRAPHS]}>
                  {(paragraph) => (
                    <Text as="p" size={2} selectable>
                      {paragraph}
                    </Text>
                  )}
                </For>
              </Show>

              <Flex as="div" justify="end" gap={3}>
                <Button
                  as="button"
                  variant="soft"
                  color="neutral"
                  testId={`${props.name}-cancel`}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  as="button"
                  testId={`${props.name}-confirm`}
                  onClick={() => setOpen(false)}
                >
                  Save
                </Button>
              </Flex>
            </Flex>
          }
        >
          <Flex as="div" direction="column" gap={3}>
            <TextField
              type="email"
              placeholder="ada@example.com"
              autocomplete="email"
              autocapitalize="off"
              enterkeyhint="send"
              testId={`${props.name}-email`}
            />
            <Flex as="div" justify="end" gap={3}>
              <Button
                as="button"
                variant="soft"
                color="neutral"
                testId={`${props.name}-cancel`}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                as="button"
                testId={`${props.name}-confirm`}
                onClick={() => setOpen(false)}
              >
                Invite
              </Button>
            </Flex>
          </Flex>
        </Show>
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
      title: 'Size',
      rows: [
        { title: '1', props: { size: 1, name: 'size-1' } },
        { title: '2', props: { size: 2, name: 'size-2' } },
        { title: '3', props: { size: 3, name: 'size-3' } },
        { title: '4', props: { size: 4, name: 'size-4' } },
      ],
    },
    {
      title: 'Alignment',
      rows: [
        {
          title: 'Center',
          props: { align: 'center', long: true, name: 'align-center' },
        },
        {
          title: 'Start',
          props: { align: 'start', long: true, name: 'align-start' },
        },
      ],
    },
    {
      title: 'Content',
      rows: [
        {
          title: 'Title only',
          props: { name: 'content-title' },
        },
        {
          title: 'With description',
          props: {
            description:
              'Invite a teammate, or change what an existing member can reach.',
            name: 'content-description',
          },
        },
        {
          title: 'Form',
          props: {
            title: 'Invite a teammate',
            description: 'They will get an email with a join link.',
            form: true,
            label: 'Invite',
            name: 'content-form',
          },
        },
        {
          title: 'Scrolling body',
          props: { long: true, name: 'content-long' },
        },
      ],
    },
    {
      title: 'Behavior',
      rows: [
        {
          title: 'Dismissible',
          props: { dismissible: true, name: 'behavior-dismissible' },
        },
        {
          title: 'Locked',
          props: {
            title: 'Unsaved changes',
            description:
              'Escape and outside clicks are off, so this has to end in a choice.',
            dismissible: false,
            label: 'Leave page',
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
