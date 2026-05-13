import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ThemeStylesheet } from '@lib/theme';
import { ErrorBoundary, Suspense } from 'solid-js';
import ErrorBoundaryFallback from './error-boundary/error-boundary';
import { Favicon } from './branding/favicon';

// Panda CSS layer entry. PostCSS finds the `@layer ...;` declaration
// inside and fills the layers with extracted atomic styles. No-op
// until the first `css()` / `cva()` / `styled()` call site exists.
import '@lib/styled-system/styles.css';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <ThemeStylesheet />
          <Favicon />
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
