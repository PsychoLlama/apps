import { createSignal, createUniqueId } from 'solid-js';
import type { Listing } from '#gallery';
import Button from '../button/button';
import Flex from '../flex/flex';
import Heading from '../heading/heading';
import Text from '../text/text';
import TextField from '../text-field/text-field';
import Popover, { type PopoverProps } from './popover';
import * as css from './popover.gallery.css';

/** What a cell can vary. The state and the trigger are the demo's. */
type DemoProps = Partial<
  Omit<PopoverProps, 'open' | 'onOpenChange' | 'children' | 'content'>
>;

/**
 * One popover with its own open state. Each cell holds an opener rather
 * than an open panel, so the gallery stays readable.
 */
const Demo = (props: DemoProps) => {
  const [open, setOpen] = createSignal(false);
  const headingId = createUniqueId();

  return (
    <div class={props.side ? css.seated[props.side] : css.stage}>
      <Popover
        display="block"
        testId="popover"
        {...props}
        open={open()}
        onOpenChange={setOpen}
        aria-labelledby={headingId}
        content={
          <Flex as="div" direction="column" gap={3}>
            <Heading as="h3" size={2} id={headingId} selectable={false}>
              Share Northwind
            </Heading>
            <Flex as="div" gap={2}>
              <TextField
                type="email"
                placeholder="ada@example.com"
                autocomplete="email"
                autocapitalize="off"
                enterkeyhint="send"
                testId="email"
              />
              <Button as="button" testId="invite">
                Invite
              </Button>
            </Flex>
            <Text as="p" size={1} selectable={false}>
              Invitees join as viewers.
            </Text>
          </Flex>
        }
      >
        {(trigger) => (
          <Button
            as="button"
            variant="soft"
            color="neutral"
            testId="trigger"
            {...trigger}
          >
            Share
          </Button>
        )}
      </Popover>
    </div>
  );
};

/** Gallery listing for `Popover`. Every cell is a trigger. */
export default {
  title: 'Popover',
  group: 'display',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Size',
      columns: [
        { title: '1', props: { size: 1 } },
        { title: '2', props: { size: 2 } },
        { title: '3', props: { size: 3 } },
        { title: '4', props: { size: 4 } },
      ],
    },
    {
      title: 'Side',
      columns: [
        { title: 'Top', props: { side: 'top' } },
        { title: 'Bottom', props: { side: 'bottom' } },
        { title: 'Left', props: { side: 'left' } },
        { title: 'Right', props: { side: 'right' } },
      ],
    },
    {
      title: 'Align',
      columns: [
        { title: 'Start', props: { align: 'start' } },
        { title: 'Center', props: { align: 'center' } },
        { title: 'End', props: { align: 'end' } },
      ],
    },
  ],
} satisfies Listing<DemoProps>;
