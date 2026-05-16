import type { Preview } from 'storybook-solidjs-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { DEFAULT_THEME_ID, THEME_ATTRIBUTE } from '@lib/theme/catalog';
import '@lib/theme';

document.documentElement.setAttribute(THEME_ATTRIBUTE, DEFAULT_THEME_ID);

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { Light: 'light', Dark: 'dark', System: '' },
      defaultTheme: 'System',
      attributeName: 'data-color-scheme',
      parentSelector: 'html',
    }),
  ],
};

export default preview;
