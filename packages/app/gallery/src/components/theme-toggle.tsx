import { onMount, type Component, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useEffect } from '@lib/state';
import { IconButton } from '@lib/ui';
import type { ColorSchemeOption } from '@lib/theme';
import {
  colorScheme,
  hydrateColorSchemeEffect,
  selectColorSchemeEffect,
} from '@lib/theme/runtime';
import IconSun from 'virtual:icons/mdi/weather-sunny';
import IconMoon from 'virtual:icons/mdi/weather-night';
import IconAuto from 'virtual:icons/mdi/auto-mode';

interface SchemeStep {
  id: ColorSchemeOption;
  label: string;
  icon: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
}

/**
 * Cycle order: System → Light → Dark → System. The button shows the
 * active step's icon and advances to the next on each press — the same
 * three options the settings appearance picker offers, compacted into a
 * single header affordance.
 */
const CYCLE: ReadonlyArray<SchemeStep> = [
  { id: 'system', label: 'System', icon: IconAuto },
  { id: 'light', label: 'Light', icon: IconSun },
  { id: 'dark', label: 'Dark', icon: IconMoon },
];

/**
 * Header control for the gallery: a compact light/dark/system toggle that
 * reads and writes through `@lib/theme`. Pressing it cycles the override,
 * flipping `<html data-color-scheme>` and persisting the choice the same
 * way the settings picker does.
 */
export const ThemeToggle = () => {
  const selectScheme = useEffect(selectColorSchemeEffect);
  const hydrateScheme = useEffect(hydrateColorSchemeEffect);

  // The prelude is the canonical pre-paint setter; the store learns the
  // on-screen value once the client mounts. Until then `colorScheme.id`
  // is null — the button renders as an inert skeleton rather than guess.
  onMount(hydrateScheme);

  const index = (): number =>
    CYCLE.findIndex((step) => step.id === colorScheme.id);
  const active = (): SchemeStep => CYCLE[index()] ?? CYCLE[0];
  const next = (): SchemeStep => CYCLE[(index() + 1) % CYCLE.length];

  return (
    <IconButton
      testId="gallery-theme-toggle"
      variant="ghost"
      color="neutral"
      skeleton={colorScheme.id === null}
      aria-label={`Appearance: ${active().label}. Switch to ${next().label}.`}
      onClick={() => selectScheme(next().id)}
    >
      <Dynamic component={active().icon} aria-hidden="true" />
    </IconButton>
  );
};
