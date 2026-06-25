import IconCheck from 'virtual:icons/mdi/check';
import type { Listing } from '#gallery';
import type { SkeletonProps } from './skeleton';
import Flex from '../components/flex/flex';
import Heading from '../components/heading/heading';
import Text from '../components/text/text';
import Badge from '../components/badge/badge';
import IconButton from '../components/icon-button/icon-button';
import TextField from '../components/text-field/text-field';
import * as css from './skeleton.gallery.css';

/**
 * Gallery listing for the `skeleton` prop — a cross-component pattern rather
 * than a single component, grouped under `patterns`. The copy is the demo:
 * each block describes how `skeleton` behaves on the components it uses, and
 * the `State` section flips every skeleton-enabled element at once so the
 * loading and loaded renders sit side by side.
 */
export default {
  title: 'Skeleton',
  group: 'patterns',
  render: (props) => (
    <Flex as="div" direction="column" gap={4} class={css.layout}>
      <Heading as="h2" size={5} selectable={false}>
        The skeleton prop
      </Heading>
      <Text as="p" size={2} selectable>
        Pass{' '}
        <Text as="span" weight="bold" selectable>
          skeleton
        </Text>{' '}
        on any component to render it as{' '}
        <Text as="span" skeleton={props.skeleton} selectable>
          a pulsing placeholder
        </Text>{' '}
        while the data behind it loads. Layout, margin, and corner shape survive
        — only the variant background and text color step out of the way.
      </Text>
      <Flex as="div" gap={2}>
        <Badge color="accent" skeleton={props.skeleton}>
          accent
        </Badge>
        <Badge color="success" skeleton={props.skeleton}>
          success
        </Badge>
        <Badge color="warning" skeleton={props.skeleton}>
          warning
        </Badge>
      </Flex>
      <Text as="p" size={2} selectable>
        Color variants collapse to the same neutral pulse, so a skeleton row
        reads as one loading region instead of three styled chips.
      </Text>
      <Flex as="div" gap={2} align="center">
        <TextField
          testId="skeleton-input"
          placeholder="you@example.com"
          autocomplete="off"
          autocapitalize="off"
          enterkeyhint="done"
          skeleton={props.skeleton}
        />
        <IconButton
          testId="skeleton-button"
          aria-label="Confirm"
          skeleton={props.skeleton}
        >
          <IconCheck />
        </IconButton>
      </Flex>
      <Text as="p" size={2} selectable>
        Inputs and buttons are individually skeletonized. While loading, focus,
        pointer events, and form submission are all suppressed.
      </Text>
    </Flex>
  ),
  sections: [
    {
      title: 'State',
      columns: [
        { title: 'Loading', props: { skeleton: true } },
        { title: 'Loaded', props: { skeleton: false } },
      ],
    },
  ],
} satisfies Listing<SkeletonProps>;
