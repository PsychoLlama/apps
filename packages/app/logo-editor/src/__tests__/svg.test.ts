import { renderLogoSvg } from '../svg';
import type { LogoEditorState } from '../state';
import { findIcon } from '../icons';

const baseState: LogoEditorState = {
  icon: findIcon('home') ?? { name: 'home', body: '<path d="M0 0"/>' },
  palette: 'blue',
  shape: 'rounded',
  padding: 20,
};

describe('renderLogoSvg', () => {
  it('emits an SVG with a viewBox sized to `size`', () => {
    const svg = renderLogoSvg(baseState, { size: 256 });

    expect(svg).toMatch(/viewBox="0 0 256 256"/);
  });

  it('embeds explicit pixel dimensions by default — needed so the image element rasterizes at the requested resolution', () => {
    const svg = renderLogoSvg(baseState, { size: 1024 });

    expect(svg).toMatch(/width="1024" height="1024"/);
  });

  it('switches to fluid dimensions when `responsive` is set', () => {
    const svg = renderLogoSvg(baseState, { size: 100, responsive: true });

    // Positive assert on the SVG root's `width`/`height` — the inner
    // clipPath rect is always sized in user units (`width="100"`)
    // regardless, so a negation would clip the wrong target.
    expect(svg).toMatch(/^<svg [^>]*width="100%" height="100%"/);
  });

  it('pins `color-scheme: light` so dark hosts cannot tint the rendered output', () => {
    const svg = renderLogoSvg(baseState);

    expect(svg).toMatch(/color-scheme: light/);
  });

  it('inlines the icon body inside a translated/scaled group', () => {
    const customIcon = { name: 'test', body: '<rect data-marker="hi"/>' };
    const svg = renderLogoSvg(
      { ...baseState, icon: customIcon },
      { size: 100 },
    );

    expect(svg).toMatch(/<rect data-marker="hi"\/>/);
    expect(svg).toMatch(/transform="translate\(20 20\) scale\(/);
  });

  it('disambiguates clip ids per `idSuffix` so multiple inline previews do not cross-resolve', () => {
    const small = renderLogoSvg(baseState, { idSuffix: 'preview-32' });
    const large = renderLogoSvg(baseState, { idSuffix: 'preview-64' });

    expect(small).toMatch(/id="logo-clip-preview-32"/);
    expect(small).toMatch(/url\(#logo-clip-preview-32\)/);
    expect(large).toMatch(/id="logo-clip-preview-64"/);
  });

  it('renders the corner radius from a shape→ratio table', () => {
    const square = renderLogoSvg(
      { ...baseState, shape: 'square' },
      { size: 100 },
    );
    const circle = renderLogoSvg(
      { ...baseState, shape: 'circle' },
      { size: 100 },
    );

    expect(square).toMatch(/rx="0" ry="0"/);
    expect(circle).toMatch(/rx="50" ry="50"/);
  });

  it('falls back to a safe blue/white pair when the palette lookup misses', () => {
    // `PaletteName` types as plain `string`, so the fallback path is
    // reachable from data — store hydration is the only guard above it.
    const svg = renderLogoSvg(
      { ...baseState, palette: 'not-a-real-palette' },
      { size: 100 },
    );

    expect(svg).toMatch(/fill="#0090ff"/);
    expect(svg).toMatch(/color: #ffffff/);
  });
});
