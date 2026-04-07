import type { Preview } from 'storybook-solidjs-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '#design-system';

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
