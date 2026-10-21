import '@lib/theme';

import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, onMount, Suspense } from 'solid-js';
import { EffectsRoot } from '@lib/effects/solid';
import { ErrorBoundaryFallback } from '@lib/shell';
import { Branding } from '@lib/shell/branding';
import { PwaMeta } from '@lib/shell/pwa';
import { AppProvider, type AppConfig } from '@lib/shell/context';
import { installServiceWorker } from '@lib/service-worker/client';
import { name } from './constants';
import { runStartupTasks } from './startup-tasks';

// Sources:
// - Favicon: https://icon-editor.psychollama.io/?icon=mdi%3Aswap-horizontal&pad=0
// - Maskable: https://icon-editor.psychollama.io/?icon=mdi%3Aswap-horizontal&pad=15&shape=square
import brandmarkSvg from './branding/brandmark.svg?url';
import touchIcon from './branding/brandmark.svg?to-png=180';

const config: AppConfig = { name };

export default function App() {
  return (
    <Router
      root={(props) => {
        onMount(runStartupTasks);
        onMount(installServiceWorker);

        return (
          <EffectsRoot>
            <AppProvider value={config}>
              <MetaProvider>
                <Branding svg={brandmarkSvg} touchIcon={touchIcon} />
                <PwaMeta />

                <ErrorBoundary
                  fallback={(error: unknown, reset) => (
                    <ErrorBoundaryFallback error={error} reset={reset} />
                  )}
                >
                  <Suspense>{props.children}</Suspense>
                </ErrorBoundary>
              </MetaProvider>
            </AppProvider>
          </EffectsRoot>
        );
      }}
    >
      <FileRoutes />
    </Router>
  );
}
