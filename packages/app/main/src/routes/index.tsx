import { For, Show, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { AbortError, useAnchor, useRun, useValue } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import { Card, Container, Flex, Heading, LinkButton, Text } from '@lib/ui';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import IconPalette from 'virtual:icons/mdi/palette-outline';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconTextBox from 'virtual:icons/mdi/text-box-outline';
import IconGallery from 'virtual:icons/mdi/brush-variant';
import IconHammerWrench from 'virtual:icons/mdi/hammer-wrench';
import IconSend from 'virtual:icons/mdi/send';
import IconCog from 'virtual:icons/mdi/cog-outline';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import IconGithub from 'virtual:icons/mdi/github';
import {
  launcherFlagsStore,
  launcherScope,
  trackLauncherFlagsSaga,
} from '../state';
import * as css from './index.css';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
 */
const APPS: ReadonlyArray<AppEntry> = [
  {
    id: 'icon-editor',
    name: 'Icon Editor',
    href: '/icon-editor',
    description:
      'Create app icons, favicons, and logos for non-commercial projects.',
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
    id: 'beam',
    name: 'Beam',
    href: '/beam',
    description: 'Encrypted sharing between devices.',
    Icon: IconSend,
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
];

/**
 * The scratchpad app. Kept out of {@link APPS} because it's gated on the
 * `scratchpad` runtime flag rather than always shown: the launcher
 * reveals it reactively (see {@link scratchpadFlag}), in lockstep with
 * the service worker's runtime route gate.
 */
const SCRATCHPAD_APP: AppEntry = {
  id: 'scratchpad',
  name: 'Scratchpad',
  href: '/scratchpad',
  description: 'Experiments and work-in-progress ideas.',
  Icon: IconHammerWrench,
};

/** A single launcher entry — a card linking to one app. */
const AppCard: Component<{ app: AppEntry }> = (props) => (
  <Flex as="li" class={css.item}>
    <Card
      as="a"
      href={props.app.href}
      size={3}
      variant="surface"
      class={css.card}
    >
      <Flex as="div" align="center" gap={4}>
        <Flex as="div" direction="column" gap={2} grow>
          <Flex as="div" align="center" gap={2}>
            <props.app.Icon
              width="20"
              height="20"
              class={css.icon}
              aria-hidden="true"
            />
            <Heading as="h2" size={3} weight="medium" selectable={false}>
              {props.app.name}
            </Heading>
          </Flex>
          <Text
            as="p"
            size={2}
            color="lowContrast"
            trim="end"
            selectable={false}
          >
            {props.app.description}
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
);

/**
 * The launcher is the suite's front door, so it carries the suite-level
 * chrome: global settings ride the header's `actions` slot (only here —
 * they'd read as app-specific anywhere else) and the source link lives
 * in the footer.
 */
const Launcher = () => {
  useAnchor(launcherScope);
  const flags = useValue(launcherFlagsStore);
  const track = useRun(trackLauncherFlagsSaga);

  // The store is seeded with the build-environment default, so first
  // paint (and prerender) match without a flash. OPFS is client-only —
  // unavailable during SSG — so the tracking saga starts on mount: it
  // subscribes, reconciles with any persisted override, then runs for as
  // long as the launcher is mounted.
  onMount(() => {
    void track().catch((error: unknown) => {
      // Releasing the anchor on cleanup aborts the saga. That's ordinary
      // teardown, and nothing to report.
      if (error instanceof AbortError) return;

      logger.error('The launcher flag tracker failed.', {
        error: toError(error),
      });
    });
  });

  return (
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
              <For each={APPS}>{(app) => <AppCard app={app} />}</For>
              <Show when={flags().scratchpadEnabled}>
                <AppCard app={SCRATCHPAD_APP} />
              </Show>
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
};

export default Launcher;
