import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { Card, Flex, Grid, Heading, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconRecord from 'virtual:icons/mdi/record-rec';
import IconPalette from 'virtual:icons/mdi/palette-outline';
import IconStorybook from 'virtual:icons/mdi/book-open-page-variant-outline';
import * as css from './index.css';

interface AppEntry {
  id: string;
  name: string;
  href: string;
  description: string;
  Icon: Component<{ width?: string; height?: string }>;
  /** Bypass client-side routing — required for static asset paths like `/__storybook/`. */
  external?: boolean;
}

/**
 * Hard-coded launcher inventory. Manually maintained per
 * `docs/launcher/vision.md`. Add an entry only when the app is
 * actually navigable — there is no "coming soon" tier.
 */
const APPS: ReadonlyArray<AppEntry> = [
  {
    id: 'studio',
    name: 'Recording Studio',
    href: '/studio',
    description: 'Record your screen straight from the browser.',
    Icon: IconRecord,
  },
  {
    id: 'icon-editor',
    name: 'Icon Editor',
    href: '/icon-editor',
    description: 'Compose a brandmark from a free icon set.',
    Icon: IconPalette,
  },
  {
    id: 'storybook',
    name: 'Storybook',
    href: '/__storybook/',
    description: 'Browse the component library and design tokens.',
    Icon: IconStorybook,
    external: true,
  },
];

const Launcher = () => (
  <Flex as="main" direction="column" grow>
    <SiteHeader title="Apps" />

    <Flex as="section" direction="column" align="center" grow px={5} py={6}>
      <Grid as="ul" gap={4} class={css.grid} aria-label="Apps">
        <For each={APPS}>
          {(app) => (
            <Flex as="li" class={css.item}>
              <Card
                as="a"
                href={app.href}
                rel={app.external ? 'external' : undefined}
                size={2}
                variant="surface"
                class={css.card}
              >
                <Flex as="div" align="center" gap={3}>
                  <Flex
                    as="div"
                    align="center"
                    justify="center"
                    class={css.iconTile}
                    aria-hidden="true"
                  >
                    <app.Icon width="40" height="40" />
                  </Flex>
                  <Flex as="div" direction="column" gap={1} grow>
                    <Heading
                      as="h2"
                      size={4}
                      weight="medium"
                      trim="start"
                      selectable={false}
                    >
                      {app.name}
                    </Heading>
                    <Text
                      as="p"
                      size={2}
                      color="lowContrast"
                      trim="end"
                      selectable={false}
                    >
                      {app.description}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            </Flex>
          )}
        </For>
      </Grid>
    </Flex>
  </Flex>
);

export default Launcher;
