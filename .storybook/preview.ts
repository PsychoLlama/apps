import type { Preview } from 'storybook-solidjs-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '@fontsource-variable/ibm-plex-sans';
import '../src/app.css';
import '#design';

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
