import { For } from 'solid-js';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { ColorSchemeOption } from '@lib/theme';
import { $appearance, $setAppearance } from '@lib/theme/behavior';
import { ResetButton } from './reset-button';
import { SettingsSection } from './settings-section';
import * as css from './appearance-settings.css';

const headingId = 'settings-appearance-heading';

interface AppearanceOption {
  id: ColorSchemeOption;
  label: string;
}

// No icons. A three-segment track carrying icon + label overflows a
// 320px viewport, and the control can't shrink below `max-content`.
const OPTIONS: ReadonlyArray<AppearanceOption> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/**
 * The Appearance section: light/dark/system. Reads/writes through
 * `@lib/theme` — selecting a segment flips `<html data-color-scheme>`
 * (or drops it, for "System") and persists the choice to localStorage.
 */
export const AppearanceSettings = () => (
  <SettingsSection
    title="Appearance"
    headingId={headingId}
    description="Sets the app's color scheme."
    action={<ResetAppearance />}
  >
    <AppearancePicker />
  </SettingsSection>
);

const AppearancePicker = () => {
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  const picker = (skeleton: boolean) => (
    <SegmentedControlRoot
      testId="appearance-picker"
      name="appearance"
      value={skeleton ? null : (appearance() ?? null)}
      skeleton={skeleton}
      onValueChange={(next) => setAppearance(next as ColorSchemeOption)}
      class={css.control}
      aria-labelledby={headingId}
    >
      <For each={OPTIONS}>
        {(entry) => (
          <SegmentedControlItem
            testId={`appearance-picker-${entry.id}`}
            value={entry.id}
          >
            {entry.label}
          </SegmentedControlItem>
        )}
      </For>
    </SegmentedControlRoot>
  );

  // The server can't know the persisted preference. A skeleton beats
  // flashing the wrong selection.
  return <Suspense fallback={picker(true)}>{picker(false)}</Suspense>;
};

// Hands the color scheme back to `'system'` — the no-override default
// that drops the persisted key and lets `@media (prefers-color-scheme)`
// take over. Disabled while already on `'system'`. Hidden until the
// preference is read off `<html>`, like the log filter's reset.
const ResetAppearance = () => {
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  return (
    <Suspense>
      <ResetButton
        testId="appearance-picker-reset"
        label="Reset appearance"
        disabled={appearance() === 'system'}
        onReset={() => setAppearance('system')}
      />
    </Suspense>
  );
};
