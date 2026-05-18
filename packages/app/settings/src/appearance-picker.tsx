import { For, onMount, type Component, type JSX } from 'solid-js';
import { useEffect } from '@lib/state';
import { Flex, RadioCardsItem, RadioCardsRoot, Text } from '@lib/ui';
import type { ColorSchemeOption } from '@lib/theme';
import {
  colorScheme,
  hydrateColorSchemeEffect,
  selectColorSchemeEffect,
} from '@lib/theme/runtime';
import IconSun from 'virtual:icons/mdi/weather-sunny';
import IconMoon from 'virtual:icons/mdi/weather-night';
import IconAuto from 'virtual:icons/mdi/auto-mode';
import * as css from './appearance-picker.css';

/**
 * `id` of the heading the picker is labelled by. Shared between the
 * heading element and the radio group's `aria-labelledby` so the two
 * stay in sync.
 */
export const appearanceHeadingId = 'settings-appearance-heading';

interface AppearanceOption {
  id: ColorSchemeOption;
  label: string;
  icon: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
}

const OPTIONS: ReadonlyArray<AppearanceOption> = [
  { id: 'system', label: 'System', icon: IconAuto },
  { id: 'light', label: 'Light', icon: IconSun },
  { id: 'dark', label: 'Dark', icon: IconMoon },
];

/**
 * Light/dark/system picker. Reads/writes through `@lib/theme` — selecting
 * a card flips `<html data-color-scheme>` (or drops it, for "System")
 * and persists the choice to localStorage.
 */
export const AppearancePicker = () => {
  const selectScheme = useEffect(selectColorSchemeEffect);
  const hydrateScheme = useEffect(hydrateColorSchemeEffect);

  // Mirrors the ThemePicker hydration pattern — the prelude is the
  // canonical pre-paint setter and the store learns what's already on
  // screen once the client mounts. The radio group renders disabled
  // with no card selected until then, which beats flashing the wrong
  // selection.
  onMount(hydrateScheme);

  return (
    <RadioCardsRoot
      testId="appearance-picker"
      name="appearance"
      value={colorScheme.id}
      skeleton={colorScheme.id === null}
      onValueChange={(next) => selectScheme(next as ColorSchemeOption)}
      gap={3}
      columns={3}
      aria-labelledby={appearanceHeadingId}
    >
      <For each={OPTIONS}>
        {(entry) => (
          <RadioCardsItem
            testId={`appearance-picker-${entry.id}`}
            value={entry.id}
            class={css.card}
          >
            <Flex as="div" direction="row" align="center" gap={2}>
              <entry.icon aria-hidden="true" />
              <Text as="span" size={2} selectable={false}>
                {entry.label}
              </Text>
            </Flex>
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );
};
