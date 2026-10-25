import { For } from 'solid-js';
import clx from '@lib/classnames';
import { useAction, useClientValue } from '@lib/effects/solid';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import { $setTheme, $theme } from '@lib/theme/behavior';
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
  const theme = useClientValue($theme, { initial: null });
  const setTheme = useAction($setTheme);

  // The server can't know the persisted preference. A skeleton beats
  // flashing the wrong selection.
  return (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={theme()}
      skeleton={!theme.ready}
      onValueChange={(next) => setTheme(next as ThemeId)}
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
};

// Snaps the theme back to `DEFAULT_THEME_ID`. Disabled while the theme
// is already default. Hidden until the preference is read off `<html>`,
// like the other resets on the page.
const ResetTheme = () => {
  const theme = useClientValue($theme);
  const setTheme = useAction($setTheme);

  return (
    <ResetButton
      testId="theme-picker-reset"
      label="Reset theme"
      ready={theme.ready}
      disabled={theme() === DEFAULT_THEME_ID}
      onReset={() => setTheme(DEFAULT_THEME_ID)}
    />
  );
};
