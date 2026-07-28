import { onMount } from 'solid-js';
import { NoHydration } from 'solid-js/web';
import { useAnchor, useRun } from '@lib/state-next';
import { Callout, Container, Flex, Heading, Text } from '@lib/ui';
import { appearanceScope, hydrateAppearanceSaga } from '@lib/theme/runtime';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { ThemePicker, ThemeResetButton, themeHeadingId } from './theme-picker';
import {
  AppearancePicker,
  AppearanceResetButton,
  appearanceHeadingId,
} from './appearance-picker';
import {
  MotionPicker,
  MotionResetButton,
  motionHeadingId,
} from './motion-picker';
import { AdvancedSettings } from './advanced-settings';

/**
 * The settings page. Anchors the appearance scope for the whole surface:
 * the theme, appearance, and motion sections each read and write it, and
 * one anchor at the root keeps every picker and its reset button looking
 * at the same live state.
 *
 * The Advanced section owns its own scope — it holds a subscription with a
 * lifetime of its own.
 */
export const Settings = () => {
  useAnchor(appearanceScope);
  const hydrateAppearance = useRun(hydrateAppearanceSaga);

  // The site is SSG'd, so the server can't know the persisted
  // preferences. The store starts unhydrated and every picker renders as
  // a skeleton — which beats flashing the wrong selection. Hydrating once
  // here, rather than per-picker, means all three sections come alive in
  // the same transition.
  onMount(() => void hydrateAppearance());

  return (
    <Frame>
      <SiteHeader title="Settings" />

      <FrameBody>
        <Container as="div" size={2}>
          <Flex as="div" direction="column" gap={5}>
            <Flex as="header" direction="column" gap={2}>
              <Heading as="h1" size={6} weight="medium" selectable={false}>
                Settings
              </Heading>
              <Text as="p" size={2} color="lowContrast" selectable={false}>
                Tune how the apps look and behave.
              </Text>
            </Flex>

            <NoHydration>
              <noscript>
                <Callout color="warning" icon={<IconAlert />}>
                  <Text as="span" size={2} selectable={false}>
                    These controls need JavaScript. Enable it to change any of
                    the settings on this page.
                  </Text>
                </Callout>
              </noscript>
            </NoHydration>

            <Flex as="section" direction="column" gap={3}>
              <Flex as="header" direction="column" gap={2}>
                <Flex
                  as="div"
                  direction="row"
                  justify="between"
                  align="center"
                  gap={3}
                >
                  <Heading
                    as="h2"
                    id={themeHeadingId}
                    size={4}
                    weight="medium"
                    selectable={false}
                  >
                    Theme
                  </Heading>
                  <ThemeResetButton />
                </Flex>
                <Text as="p" size={2} color="lowContrast" selectable={false}>
                  Sets the app's primary color.
                </Text>
              </Flex>

              <ThemePicker />
            </Flex>

            <Flex as="section" direction="column" gap={3}>
              <Flex as="header" direction="column" gap={2}>
                <Flex
                  as="div"
                  direction="row"
                  justify="between"
                  align="center"
                  gap={3}
                >
                  <Heading
                    as="h2"
                    id={appearanceHeadingId}
                    size={4}
                    weight="medium"
                    selectable={false}
                  >
                    Appearance
                  </Heading>
                  <AppearanceResetButton />
                </Flex>
                <Text as="p" size={2} color="lowContrast" selectable={false}>
                  Sets the app's color scheme.
                </Text>
              </Flex>

              <AppearancePicker />
            </Flex>

            <Flex as="section" direction="column" gap={3}>
              <Flex as="header" direction="column" gap={2}>
                <Flex
                  as="div"
                  direction="row"
                  justify="between"
                  align="center"
                  gap={3}
                >
                  <Heading
                    as="h2"
                    id={motionHeadingId}
                    size={4}
                    weight="medium"
                    selectable={false}
                  >
                    Motion
                  </Heading>
                  <MotionResetButton />
                </Flex>
                <Text as="p" size={2} color="lowContrast" selectable={false}>
                  Controls animations and transitions.
                </Text>
              </Flex>

              <MotionPicker />
            </Flex>

            <Flex as="section" direction="column">
              <AdvancedSettings />
            </Flex>
          </Flex>
        </Container>
      </FrameBody>
    </Frame>
  );
};
