import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { Card, Container, Flex, Heading, Text } from '@lib/ui';
import { FrameBody, SiteHeader } from '@lib/shell';
import IconTooltip from 'virtual:icons/mdi/tooltip-outline';
import * as css from './home.css';

/** One experiment, listed on the scratchpad's front page. */
interface ExperimentEntry {
  id: string;
  name: string;
  href: string;
  description: string;
  Icon: Component<{ width?: string; height?: string; class?: string }>;
}

/**
 * Every experiment living under `/scratchpad`, one entry per route file
 * beside this one. Add the route first, then list it here — an entry with
 * nothing behind it is a dead link, and there's no "planned" tier.
 */
const EXPERIMENTS: ReadonlyArray<ExperimentEntry> = [
  {
    id: 'floating-ui',
    name: 'Floating UI',
    href: '/scratchpad/floating-ui',
    description:
      'Interactive testing for anchored window placement primitives.',
    Icon: IconTooltip,
  },
];

/** A single experiment entry — a card linking to one route. */
const ExperimentCard: Component<{ experiment: ExperimentEntry }> = (props) => (
  <Flex as="li" class={css.item}>
    <Card
      as="a"
      href={props.experiment.href}
      size={3}
      variant="surface"
      class={css.card}
    >
      <Flex as="div" direction="column" gap={2}>
        <Flex as="div" align="center" gap={2}>
          <props.experiment.Icon
            width="20"
            height="20"
            class={css.icon}
            aria-hidden="true"
          />
          <Heading as="h2" size={3} weight="medium" selectable={false}>
            {props.experiment.name}
          </Heading>
        </Flex>
        <Text as="p" size={2} color="lowContrast" trim="end" selectable={false}>
          {props.experiment.description}
        </Text>
      </Flex>
    </Card>
  </Flex>
);

/**
 * The scratchpad's front door at `/scratchpad`: an index of the
 * experiments living on the routes beneath it. Nothing is experimented
 * with here — this page only points at the subroutes that do, the way the
 * suite launcher points at apps.
 *
 * Starting a new experiment means adding a route file beside this one and
 * an entry in {@link EXPERIMENTS}.
 */
const ScratchpadHome = () => (
  <>
    <SiteHeader title="Scratchpad" />

    <FrameBody as="section">
      <Flex as="div" direction="column" align="center" gap={6} grow>
        <Flex as="hgroup" direction="column" align="center" gap={3}>
          <Heading as="h1" size={8} trim="start" selectable={false}>
            Scratchpad
          </Heading>
          <Text
            as="p"
            size={3}
            color="lowContrast"
            trim="end"
            selectable={false}
          >
            Experiments and in-progress work.
          </Text>
        </Flex>

        <Container as="div" size={2}>
          <Flex
            as="ul"
            direction="column"
            gap={3}
            class={css.list}
            aria-label="Experiments"
          >
            <For each={EXPERIMENTS}>
              {(experiment) => <ExperimentCard experiment={experiment} />}
            </For>
          </Flex>
        </Container>
      </Flex>
    </FrameBody>
  </>
);

export default ScratchpadHome;
