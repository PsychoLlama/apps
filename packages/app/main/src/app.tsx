import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ThemeStylesheet } from '@lib/theme';
import { ErrorBoundary, Suspense } from 'solid-js';
import ErrorBoundaryFallback from './error-boundary/error-boundary';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <ThemeStylesheet />
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
