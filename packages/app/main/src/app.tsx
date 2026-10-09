import '@lib/theme';

import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, onMount, Suspense } from 'solid-js';
import { ErrorBoundaryFallback } from '@lib/shell';
import { AppProvider, type AppConfig } from '@lib/shell/context';
import { Favicon } from './branding/favicon';
import { NavigationLogger } from './navigation-logger';
import { runStartupTasks } from './startup-tasks';

const config: AppConfig = { name: 'Apps' };

export default function App() {
  return (
    <Router
      root={(props) => {
        onMount(runStartupTasks);

        return (
          <AppProvider value={config}>
            <MetaProvider>
              <Favicon />
              <NavigationLogger />
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
