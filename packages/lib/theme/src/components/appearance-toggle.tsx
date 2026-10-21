import type { Component, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { Button } from '@lib/ui';
import type { ColorSchemeOption } from '../constants';
import { $setAppearance } from '../effects/appearance';
import { $appearance } from '../state/appearance';
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
 * Light/dark/system toggle. Reads and writes through the theme state
 * and effects: pressing it cycles the color-scheme override, flipping
 * `<html data-color-scheme>` and persisting the choice — the single-button
 * counterpart to the settings page's three-card `AppearancePicker`. Drop
 * it anywhere a header or toolbar wants quick appearance control.
 */
export const AppearanceToggle = () => {
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  const index = (): number =>
    CYCLE.findIndex((step) => step.id === appearance()?.colorScheme);

  const active = (): SchemeStep => CYCLE[index()] ?? CYCLE[0];
  const next = (): SchemeStep => CYCLE[(index() + 1) % CYCLE.length];

  // The server can't know the persisted preference, so the button renders
  // as an inert skeleton until the client reads it off `<html>`.
  return (
    <Suspense
      fallback={
        <Button
          testId="appearance-toggle"
          variant="ghost"
          color="neutral"
          skeleton
        >
          <Dynamic component={CYCLE[0].icon} aria-hidden="true" />
          {CYCLE[0].label}
        </Button>
      }
    >
      <Button
        testId="appearance-toggle"
        variant="ghost"
        color="neutral"
        onClick={() => setAppearance('colorScheme', next().id)}
      >
        <Dynamic component={active().icon} aria-hidden="true" />
        {active().label}
      </Button>
    </Suspense>
  );
};
