import { onMount, type Component, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useEffect } from '@lib/state';
import { Button } from '@lib/ui';
import type { ColorSchemeOption } from './constants';
import {
  colorScheme,
  hydrateColorSchemeEffect,
  selectColorSchemeEffect,
} from './runtime';
import IconSun from 'virtual:icons/mdi/weather-sunny';
import IconMoon from 'virtual:icons/mdi/weather-night';
import IconSystem from 'virtual:icons/mdi/theme-light-dark';

interface SchemeStep {
  id: ColorSchemeOption;
  label: string;
  icon: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
}

/**
 * Cycle order: System → Light → Dark → System. The button shows the
 * active step's icon and advances to the next on each press — the same
 * three options the settings appearance picker offers, compacted into a
 * single control.
 */
const CYCLE: ReadonlyArray<SchemeStep> = [
  { id: 'system', label: 'System', icon: IconSystem },
  { id: 'light', label: 'Light', icon: IconSun },
  { id: 'dark', label: 'Dark', icon: IconMoon },
];

/**
 * Light/dark/system toggle. Reads and writes through the theme
 * runtime: pressing it cycles the color-scheme override, flipping
 * `<html data-color-scheme>` and persisting the choice — the single-button
 * counterpart to the settings page's three-card `AppearancePicker`. Drop
 * it anywhere a header or toolbar wants quick appearance control.
 */
export const AppearanceToggle = () => {
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
    <Button
      testId="appearance-toggle"
      variant="ghost"
      color="neutral"
      skeleton={colorScheme.id === null}
      onClick={() => selectScheme(next().id)}
    >
      <Dynamic component={active().icon} aria-hidden="true" />
      {active().label}
    </Button>
  );
};
