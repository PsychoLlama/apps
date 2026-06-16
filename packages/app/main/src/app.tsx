import '@lib/theme';

import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, Suspense } from 'solid-js';
import { ErrorBoundaryFallback } from '@lib/shell';
import { Favicon } from './branding/favicon';
import { NavigationLogger } from './navigation-logger';

export default function App() {
  return (
    <Router
      root={(props) => (
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
      )}
    >
      <FileRoutes />
    </Router>
  );
}
