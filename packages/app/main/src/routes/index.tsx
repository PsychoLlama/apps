import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { Title } from '@solidjs/meta';
import { Card, Flex, Grid, Heading, LinkButton, Text } from '@lib/ui';
import IconPalette from 'virtual:icons/mdi/palette-outline';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconStorybook from 'virtual:icons/mdi/book-open-page-variant-outline';
import IconFlask from 'virtual:icons/mdi/flask-outline';
import IconCog from 'virtual:icons/mdi/cog-outline';
import IconGithub from 'virtual:icons/mdi/github';
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
 * Hard-coded launcher inventory. Add an entry only when the target
 * is actually navigable — there is no "coming soon" tier.
 *
 * The experimental entry is gated on `INCLUDE_EXPERIMENTAL_APP` (baked
 * in by the host's vite config), so it appears only on the builds that
 * actually ship the `/experimental` route — preview and local, never
 * production. The constant folds to a literal at build time, so the
 * unused branch is dead-code-eliminated.
 */
const APPS: ReadonlyArray<AppEntry> = [
  {
    id: 'icon-editor',
    name: 'Icon Editor',
    href: '/icon-editor',
    description: 'Compose a brandmark from a free icon set.',
    Icon: IconPalette,
  },
  {
    id: 'scanner',
    name: 'Scanner',
    href: '/scanner',
    description: 'Read QR codes with your device camera.',
    Icon: IconQrcodeScan,
  },
  {
    id: 'storybook',
    name: 'Storybook',
    href: '/__storybook/',
    description: 'Browse the component library and design tokens.',
    Icon: IconStorybook,
    external: true,
  },
  ...(import.meta.env.INCLUDE_EXPERIMENTAL_APP
    ? [
        {
          id: 'experimental',
          name: 'Experimental',
          href: '/experimental',
          description: 'Scratchpad for work-in-progress ideas.',
          Icon: IconFlask,
        } satisfies AppEntry,
      ]
    : []),
];

/**
 * The launcher is the suite's front door, so it carries the suite-level
 * chrome the per-app `SiteHeader` deliberately omits: global settings
 * and the source link. It skips `SiteHeader` itself — a "back to Apps"
 * affordance is meaningless when you're already there.
 */
const Launcher = () => (
  <Flex as="main" direction="column" grow>
    <Title>Apps</Title>

    <Flex as="header" justify="end" gap={2} px={4} class={css.topBar}>
      <LinkButton
        testId="github"
        href="https://github.com/PsychoLlama/apps"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub repository"
        variant="ghost"
        color="neutral"
      >
        <IconGithub width="24" height="24" />
      </LinkButton>

      <LinkButton
        testId="settings"
        href="/settings"
        aria-label="Settings"
        variant="ghost"
        color="neutral"
      >
        <IconCog width="24" height="24" />
      </LinkButton>
    </Flex>

    <Flex
      as="section"
      direction="column"
      align="center"
      gap={7}
      grow
      px={5}
      py={7}
    >
      <Flex as="hgroup" direction="column" align="center" gap={3}>
        <Heading as="h1" size={8} trim="start" selectable={false}>
          Apps
        </Heading>
        <Text as="p" size={3} color="lowContrast" trim="end" selectable={false}>
          A handful of small, single-purpose tools.
        </Text>
      </Flex>

      <Grid as="ul" gap={4} class={css.grid} aria-label="Apps">
        <For each={APPS}>
          {(app) => (
            <Flex as="li" class={css.item}>
              <Card
                as="a"
                href={app.href}
                rel={app.external ? 'external' : undefined}
                size={3}
                variant="surface"
                class={css.card}
              >
                <Flex as="div" direction="column" gap={4}>
                  <Flex
                    as="div"
                    align="center"
                    justify="center"
                    class={css.iconTile}
                    aria-hidden="true"
                  >
                    <app.Icon width="24" height="24" />
                  </Flex>
                  <Flex as="div" direction="column" gap={2}>
                    <Heading
                      as="h2"
                      size={3}
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
