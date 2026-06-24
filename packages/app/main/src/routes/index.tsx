import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { Card, Container, Flex, Heading, LinkButton, Text } from '@lib/ui';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import IconPalette from 'virtual:icons/mdi/palette-outline';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconTextBox from 'virtual:icons/mdi/text-box-outline';
import IconGallery from 'virtual:icons/mdi/brush-variant';
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
      'Restyle an icon from the Iconify catalog and export it as a brandmark.',
    Icon: IconPalette,
  },
  {
    id: 'scanner',
    name: 'Scanner',
    href: '/scanner',
    description:
      'Scan QR codes with your camera. Decoding runs entirely on your device.',
    Icon: IconQrcodeScan,
  },
  {
    id: 'logs',
    name: 'Logs',
    href: '/logs',
    description:
      'Browse and export the session logs this device has saved on disk.',
    Icon: IconTextBox,
  },
  {
    id: 'gallery',
    name: 'Gallery',
    href: '/gallery',
    description: 'Browse the component library and design system.',
    Icon: IconGallery,
  },
  ...(import.meta.env.INCLUDE_EXPERIMENTAL_APP
    ? [
        {
          id: 'experimental',
          name: 'Experimental',
          href: '/experimental',
          description: 'A scratchpad for work-in-progress ideas.',
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
  <Frame>
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

    <FrameBody as="section">
      <Flex as="div" direction="column" align="center" gap={6} grow>
        <Flex as="hgroup" direction="column" align="center" gap={3}>
          <Heading as="h1" size={8} trim="start" selectable={false}>
            Apps
          </Heading>
          <Text
            as="p"
            size={3}
            color="lowContrast"
            trim="end"
            selectable={false}
          >
            A handful of small, single-purpose tools.
          </Text>
        </Flex>

        <Container as="div" size={2}>
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
                    size={3}
                    variant="surface"
                    class={css.card}
                  >
                    <Flex as="div" align="center" gap={4}>
                      <Flex as="div" direction="column" gap={2} grow>
                        <Flex as="div" align="center" gap={2}>
                          <app.Icon
                            width="20"
                            height="20"
                            class={css.icon}
                            aria-hidden="true"
                          />
                          <Heading
                            as="h2"
                            size={3}
                            weight="medium"
                            selectable={false}
                          >
                            {app.name}
                          </Heading>
                        </Flex>
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
        </Container>
      </Flex>

      <Flex as="footer" justify="end">
        <LinkButton
          testId="github"
          href="https://github.com/PsychoLlama/apps"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source on GitHub"
          variant="ghost"
          color="neutral"
        >
          <IconGithub width="20" height="20" />
        </LinkButton>
      </Flex>
    </FrameBody>
  </Frame>
);

export default Launcher;
