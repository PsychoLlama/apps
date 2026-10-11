import '@lib/theme';

import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, onMount, Suspense } from 'solid-js';
import { ErrorBoundaryFallback } from '@lib/shell';
import { Branding } from '@lib/shell/branding';
import { AppProvider, type AppConfig } from '@lib/shell/context';
import IconApps from 'virtual:icons/mdi/apps';
import { NavigationLogger } from './navigation-logger';
import { runStartupTasks } from './startup-tasks';

// Sources:
// - Favicon: https://icon-editor.psychollama.io/?icon=mdi%3Aflask&pad=10
// - Maskable: https://icon-editor.psychollama.io/?icon=mdi%3Aflask&shape=square&pad=15
import brandmarkSvg from './branding/brandmark.svg?url';
import touchIcon from './branding/brandmark.svg?to-png=180';

const config: AppConfig = { name: 'Apps', icon: IconApps };

export default function App() {
  return (
    <Router
      root={(props) => {
        onMount(runStartupTasks);

        return (
          <AppProvider value={config}>
            <MetaProvider>
              <NavigationLogger />
              <Branding svg={brandmarkSvg} touchIcon={touchIcon} pwa={true} />

              <ErrorBoundary
                fallback={(error: unknown, reset) => (
                  <ErrorBoundaryFallback error={error} reset={reset} />
                )}
              >
                <Suspense>{props.children}</Suspense>
              </ErrorBoundary>
            </MetaProvider>
          </AppProvider>
        );
      }}
    >
      <FileRoutes />
    </Router>
  );
}
