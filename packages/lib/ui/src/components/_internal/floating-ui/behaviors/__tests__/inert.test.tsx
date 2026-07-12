import { createRoot, createSignal } from 'solid-js';
import { createInertScope } from '../inert';

/**
 * Builds:
 *   body > header
 *   body > main > sidebar
 *   body > main > content > layer
 *   body > footer
 */
const buildPage = () => {
  document.body.innerHTML = `
    <header id="header"></header>
    <main id="main">
      <div id="sidebar"></div>
      <div id="content">
        <div id="layer"></div>
        <div id="layer-sibling"></div>
      </div>
    </main>
    <footer id="footer"></footer>
  `;

  const byId = (id: string) => document.getElementById(id)!;
  return {
    header: byId('header'),
    main: byId('main'),
    sidebar: byId('sidebar'),
    content: byId('content'),
    layer: byId('layer'),
    layerSibling: byId('layer-sibling'),
    footer: byId('footer'),
  };
};

const mountScope = (layer: () => HTMLElement | null) =>
  createRoot((dispose) => {
    createInertScope(layer);
    return dispose;
  });

describe('createInertScope', () => {
  it('inerts every subtree outside the layer chain, and nothing on it', () => {
    const page = buildPage();
    const dispose = mountScope(() => page.layer);

    // Siblings at every level up the chain go inert...
    expect(page.layerSibling).toHaveAttribute('inert');
    expect(page.sidebar).toHaveAttribute('inert');
    expect(page.header).toHaveAttribute('inert');
    expect(page.footer).toHaveAttribute('inert');

    // ...while the chain itself stays live.
    expect(page.layer).not.toHaveAttribute('inert');
    expect(page.content).not.toHaveAttribute('inert');
    expect(page.main).not.toHaveAttribute('inert');

    dispose();
  });

  it('restores everything on release', () => {
    const page = buildPage();
    const dispose = mountScope(() => page.layer);
    dispose();

    expect(page.header).not.toHaveAttribute('inert');
    expect(page.sidebar).not.toHaveAttribute('inert');
    expect(page.layerSibling).not.toHaveAttribute('inert');
  });

  it('leaves author-set inert in place', () => {
    const page = buildPage();
    page.header.setAttribute('inert', '');

    const dispose = mountScope(() => page.layer);
    expect(page.header).toHaveAttribute('inert');
    dispose();

    // The author put it there; the scope must not take it away.
    expect(page.header).toHaveAttribute('inert');
  });

  it('reference-counts overlapping scopes', () => {
    const page = buildPage();

    // A second layer nested inside the first one's chain: both claim
    // the header.
    const disposeOuter = mountScope(() => page.content);
    const disposeInner = mountScope(() => page.layer);
    expect(page.header).toHaveAttribute('inert');

    // The outer scope releasing must not free what the inner still
    // needs.
    disposeOuter();
    expect(page.header).toHaveAttribute('inert');

    disposeInner();
    expect(page.header).not.toHaveAttribute('inert');
  });

  it('activates and lifts reactively', () => {
    const page = buildPage();
    const [layer, setLayer] = createSignal<HTMLElement | null>(null);
    // eslint-disable-next-line solid/reactivity -- createInertScope tracks the accessor in its own effect
    const dispose = mountScope(layer);

    expect(page.header).not.toHaveAttribute('inert');

    setLayer(page.layer);
    expect(page.header).toHaveAttribute('inert');

    setLayer(null);
    expect(page.header).not.toHaveAttribute('inert');

    dispose();
  });
});
