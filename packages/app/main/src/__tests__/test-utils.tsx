import { MetaProvider } from '@solidjs/meta';
import { MemoryRouter, Route } from '@solidjs/router';
import { render } from '@solidjs/testing-library';
import type { Component } from 'solid-js';

/**
 * Render a component wrapped in the same top-level providers the app uses
 * (`MetaProvider` + a client-side router). Tests for anything that touches
 * routing or document metadata should mount through here so the context
 * matches production.
 */
export const renderWithAppShell = (component: Component) => {
  return render(() => (
    <MetaProvider>
      <MemoryRouter>
        <Route path="*" component={component} />
      </MemoryRouter>
    </MetaProvider>
  ));
};
