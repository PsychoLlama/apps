import { For } from 'solid-js';
import clx from '@lib/classnames';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import { $setPreferences } from '@lib/theme/effects';
import { $preferences } from '@lib/theme/state';
import { ResetButton } from './reset-button';
import { SettingsSection } from './settings-section';
import * as css from './theme-settings.css';

const headingId = 'settings-theme-heading';

/**
 * The Theme section: sets the app's primary color. Reads/writes the
 * active theme through `@lib/theme` — selecting a card flips
 * `<html data-theme>` and persists the choice to localStorage.
 */
export const ThemeSettings = () => (
  <SettingsSection
    title="Theme"
    headingId={headingId}
    description="Sets the app's primary color."
    action={<ResetTheme />}
  >
    <ThemePicker />
  </SettingsSection>
);

// One `RadioCards` card per built-in theme.
const ThemePicker = () => {
  const preferences = useClientResource($preferences);
  const setPreferences = useAction($setPreferences);

  const picker = (skeleton: boolean) => (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={skeleton ? null : (preferences()?.theme ?? null)}
      skeleton={skeleton}
      onValueChange={(next) => setPreferences('theme', next as ThemeId)}
      gap={3}
      class={css.root}
      aria-labelledby={headingId}
    >
      <For each={THEMES}>
        {(entry) => (
          <RadioCardsItem
            testId={`theme-picker-${entry.id}`}
            value={entry.id}
            class={clx(css.swatchBase, css.swatchTint[entry.id])}
          >
            {entry.label}
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );

  // The server can't know the persisted preference. A skeleton beats
  // flashing the wrong selection.
  return <Suspense fallback={picker(true)}>{picker(false)}</Suspense>;
};

// Snaps the theme back to `DEFAULT_THEME_ID`. Disabled while the theme
// is already default. Hidden until the preference is read off `<html>`,
// like the other resets on the page.
const ResetTheme = () => {
  const preferences = useClientResource($preferences);
  const setPreferences = useAction($setPreferences);

  return (
    <Suspense>
      <ResetButton
        testId="theme-picker-reset"
        label="Reset theme"
        disabled={preferences()?.theme === DEFAULT_THEME_ID}
        onReset={() => setPreferences('theme', DEFAULT_THEME_ID)}
      />
    </Suspense>
  );
};
