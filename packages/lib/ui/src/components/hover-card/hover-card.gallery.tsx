import type { Listing } from '#gallery';
import Flex from '../flex/flex';
import Heading from '../heading/heading';
import Link from '../link/link';
import Text from '../text/text';
import HoverCard, { type HoverCardProps } from './hover-card';
import * as css from './hover-card.gallery.css';

/** What a cell can vary. The trigger and the card are the demo's. */
type DemoProps = Partial<Omit<HoverCardProps, 'children' | 'content'>>;

/**
 * A project summary on a mention of Northwind, the project our other
 * overlay listings act on. The summary is selectable and the link is
 * reachable by Tab, so both holds and keyboard access can be tried from
 * any cell.
 */
const Demo = (props: DemoProps) => (
  <div class={props.side ? css.seated[props.side] : css.stage}>
    <HoverCard
      display="block"
      testId="hover-card"
      {...props}
      content={
        <Flex as="div" direction="column" gap={2} class={css.summary}>
          <Heading as="h3" size={3} selectable={false}>
            Northwind
          </Heading>
          <Text as="p" size={2} selectable>
            Quarterly planning for the logistics team: roadmap, budget, and
            hiring.
          </Text>
          <Text as="p" size={1} color="lowContrast" selectable={false}>
            4 members · Updated 2 hours ago
          </Text>
          <Link href="#northwind" size={2} testId="open">
            Open project
          </Link>
        </Flex>
      }
    >
      {(trigger) => (
        <Link href="#northwind" testId="trigger" {...trigger}>
          Northwind
        </Link>
      )}
    </HoverCard>
  </div>
);

/**
 * Gallery listing for `HoverCard`. Every cell is a trigger — hover or
 * focus it to see the card.
 */
export default {
  title: 'HoverCard',
  group: 'display',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Size',
      columns: [
        { title: '1', props: { size: 1 } },
        { title: '2', props: { size: 2 } },
        { title: '3', props: { size: 3 } },
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
