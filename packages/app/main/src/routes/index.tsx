import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { Card, Flex, Heading, Link, LinkButton, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconPalette from 'virtual:icons/mdi/palette-outline';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconStorybook from 'virtual:icons/mdi/book-open-page-variant-outline';
import IconFlask from 'virtual:icons/mdi/flask-outline';
import IconCog from 'virtual:icons/mdi/cog-outline';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import IconGithub from 'virtual:icons/mdi/github';
import * as css from './index.css';

interface AppEntry {
  id: string;
  name: string;
  href: string;
  description: string;
  Icon: Component<{ width?: string; height?: string; class?: string }>;
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
    description:
      'Pick a glyph from the open Iconify catalog, restyle it until it feels like yours, and export the result as a brandmark.',
    Icon: IconPalette,
  },
  {
    id: 'scanner',
    name: 'Scanner',
    href: '/scanner',
    description:
      'Point your camera at a QR code and see what it’s hiding. Decoding happens on your device — nothing is uploaded anywhere.',
    Icon: IconQrcodeScan,
  },
  {
    id: 'storybook',
    name: 'Storybook',
    href: '/__storybook/',
    description:
      'The workshop behind everything else here: every component and design token in the system, laid out for browsing.',
    Icon: IconStorybook,
    external: true,
  },
  ...(import.meta.env.INCLUDE_EXPERIMENTAL_APP
    ? [
        {
          id: 'experimental',
          name: 'Experimental',
          href: '/experimental',
          description:
            'A scratchpad for ideas that aren’t apps yet. Expect sharp edges, dead ends, and frequent rearranging.',
          Icon: IconFlask,
        } satisfies AppEntry,
      ]
    : []),
];

/**
 * The launcher is the suite's front door, so it carries the suite-level
 * chrome: global settings ride the header's `actions` slot (only here —
 * they'd read as app-specific anywhere else) and the source link lives
 * in the footer.
 */
const Launcher = () => (
  <Flex as="main" direction="column" grow>
    <SiteHeader
      actions={
        <LinkButton
          testId="settings"
          href="/settings"
          aria-label="Settings"
          variant="ghost"
          color="neutral"
        >
          <IconCog width="24" height="24" />
        </LinkButton>
      }
    />

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

      <Flex
        as="ul"
        direction="column"
        gap={3}
        class={css.list}
        aria-label="Apps"
      >
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
                <Flex as="div" align="center" gap={4}>
                  <app.Icon
                    width="24"
                    height="24"
                    class={css.icon}
                    aria-hidden="true"
                  />
                  <Flex as="div" direction="column" gap={2} grow>
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
                  <IconChevronRight
                    width="20"
                    height="20"
                    class={css.chevron}
                    aria-hidden="true"
                  />
                </Flex>
              </Card>
            </Flex>
          )}
        </For>
      </Flex>
    </Flex>

    <Flex
      as="footer"
      align="center"
      justify="center"
      gap={2}
      px={5}
      py={5}
      class={css.footer}
    >
      <IconGithub width="16" height="16" aria-hidden="true" />
      <Link
        testId="github"
        href="https://github.com/PsychoLlama/apps"
        target="_blank"
        rel="noopener noreferrer"
        size={2}
        color="neutral"
        underline="hover"
      >
        Built in the open — source on GitHub
      </Link>
    </Flex>
  </Flex>
);

export default Launcher;
