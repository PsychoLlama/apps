import { defineConfig } from 'vite';
import { substrate } from '@dev/vite-plugin-substrate';

export default defineConfig({
  plugins: [
    substrate({
      type: 'app',
      // Only here to export logs. The gallery has no use for offline.
      serviceWorker: {
        path: 'src/service-worker/index.ts',
        offline: false,
      },
    }),
  ],
});
