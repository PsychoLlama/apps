import '@lib/theme';

import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, onMount, Suspense } from 'solid-js';
import { ErrorBoundaryFallback } from '@lib/shell';
import { AppProvider, type AppConfig } from '@lib/shell/context';
import { runStartupTasks } from './startup-tasks';

const config: AppConfig = { name: 'Icon Editor' };

export default function App() {
  return (
    <Router
      root={(props) => {
        onMount(runStartupTasks);

        return (
          <AppProvider value={config}>
            <MetaProvider>
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
