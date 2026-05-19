import { renderIconSvg } from '../svg';
import type { IconEditorState } from '../store';
import type { IconRef } from '../icons';

const sampleIcon: IconRef = {
  pack: 'mdi',
  name: 'home',
  body: '<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>',
  width: 24,
  height: 24,
  license: {
    title: 'Apache 2.0',
    spdx: 'Apache-2.0',
    url: 'https://github.com/Templarian/MaterialDesign/blob/master/LICENSE',
  },
  author: {
    name: 'Pictogrammers',
    url: 'https://github.com/Templarian/MaterialDesign',
  },
};

const baseState: IconEditorState = {
  icon: sampleIcon,
  palette: 'blue',
  shape: 'rounded',
  padding: 20,
};

describe('renderIconSvg', () => {
  it('emits an SVG with a viewBox sized to `size`', () => {
    const svg = renderIconSvg(baseState, { size: 256 });

    expect(svg).toMatch(/viewBox="0 0 256 256"/);
  });

  it('embeds explicit pixel dimensions by default — needed so the image element rasterizes at the requested resolution', () => {
    const svg = renderIconSvg(baseState, { size: 1024 });

    expect(svg).toMatch(/width="1024" height="1024"/);
  });

  it('switches to fluid dimensions when `responsive` is set', () => {
    const svg = renderIconSvg(baseState, { size: 100, responsive: true });

    // Positive assert on the SVG root's `width`/`height` — the inner
    // clipPath rect is always sized in user units (`width="100"`)
    // regardless, so a negation would clip the wrong target.
    expect(svg).toMatch(/^<svg [^>]*width="100%" height="100%"/);
  });

  it('pins `color-scheme: light` so dark hosts cannot tint the rendered output', () => {
    const svg = renderIconSvg(baseState);

    expect(svg).toMatch(/color-scheme: light/);
  });

  it('inlines the icon body inside a translated/scaled group', () => {
    const customIcon = {
      pack: 'mdi',
      name: 'test',
      body: '<rect data-marker="hi"/>',
      width: 24,
      height: 24,
    };
    const svg = renderIconSvg(
      { ...baseState, icon: customIcon },
      { size: 100 },
    );

    expect(svg).toMatch(/<rect data-marker="hi"\/>/);
    expect(svg).toMatch(/transform="translate\(20 20\) scale\(/);
  });

  it('scales against the larger native viewBox axis so non-24 packs still fit', () => {
    const tallIcon = {
      pack: 'fluent',
      name: 'ribbon',
      body: '<rect/>',
      width: 32,
      height: 32,
    };
    const svg = renderIconSvg(
      { ...baseState, icon: tallIcon, padding: 0 },
      { size: 64 },
    );

    // 64 / max(32, 32) = 2 — direct unit mapping.
    expect(svg).toMatch(/scale\(2\)/);
  });

  it('disambiguates clip ids per `idSuffix` so multiple inline previews do not cross-resolve', () => {
    const small = renderIconSvg(baseState, { idSuffix: 'preview-32' });
    const large = renderIconSvg(baseState, { idSuffix: 'preview-64' });

    expect(small).toMatch(/id="icon-clip-preview-32"/);
    expect(small).toMatch(/url\(#icon-clip-preview-32\)/);
    expect(large).toMatch(/id="icon-clip-preview-64"/);
  });

  it('renders the corner radius from a shape→ratio table', () => {
    const square = renderIconSvg(
      { ...baseState, shape: 'square' },
      { size: 100 },
    );
    const circle = renderIconSvg(
      { ...baseState, shape: 'circle' },
      { size: 100 },
    );

    expect(square).toMatch(/rx="0" ry="0"/);
    expect(circle).toMatch(/rx="50" ry="50"/);
  });

  it('omits the attribution metadata block by default', () => {
    const svg = renderIconSvg(baseState);

    expect(svg).not.toMatch(/<metadata>/);
  });

  it('embeds Dublin Core / CC attribution metadata when `metadata: true`', () => {
    const svg = renderIconSvg(baseState, { metadata: true });

    expect(svg).toMatch(/<metadata>/);
    // Pack:name as the work's title.
    expect(svg).toMatch(/<dc:title>mdi:home<\/dc:title>/);
    // Author and license travel from the IconRef.
    expect(svg).toMatch(/Pictogrammers/);
    expect(svg).toMatch(/Apache 2\.0/);
    // License URL is anchored as a `cc:license` resource.
    expect(svg).toMatch(/<cc:license rdf:resource="[^"]*LICENSE/);
    // SPDX surfaces under `dc:rightsHolder` for machine consumers.
    expect(svg).toMatch(/SPDX:Apache-2\.0/);
  });

  it('escapes user-supplied metadata so an icon body can never break the XML', () => {
    const naughty = {
      pack: 'mdi',
      name: 'home',
      body: '<rect/>',
      width: 24,
      height: 24,
      author: { name: 'A & B <C>', url: 'https://x.test/?a="b"' },
      license: { title: 'MIT "with quotes"', spdx: 'MIT', url: undefined },
    };
    const svg = renderIconSvg(
      { ...baseState, icon: naughty },
      { metadata: true },
    );

    expect(svg).toMatch(/A &amp; B &lt;C&gt;/);
    expect(svg).toMatch(/MIT &quot;with quotes&quot;/);
    expect(svg).toMatch(/https:\/\/x\.test\/\?a=&quot;b&quot;/);
  });

  it('renders the blueprint placeholder when no icon is chosen — same shape mask plus dashed inner outline and centered cross', () => {
    const svg = renderIconSvg({ ...baseState, icon: undefined }, { size: 200 });

    // Background fill from the palette still paints, so the empty state
    // previews palette/shape/padding choices meaningfully.
    expect(svg).toMatch(/fill="#0090ff"/);
    // Dashed outline + cross marks the missing slot.
    expect(svg).toMatch(/stroke-dasharray=/);
    expect(svg).toMatch(/<line /);
    // The icon body group is suppressed.
    expect(svg).not.toMatch(/transform="translate/);
  });

  it('drops the attribution metadata block on the blueprint placeholder — no icon means no source to credit', () => {
    const svg = renderIconSvg(
      { ...baseState, icon: undefined },
      { metadata: true },
    );

    expect(svg).not.toMatch(/<metadata>/);
  });

  it('falls back to a safe blue/white pair when the palette lookup misses', () => {
    // `PaletteName` types as plain `string`, so the fallback path is
    // reachable from data — store hydration is the only guard above it.
    const svg = renderIconSvg(
      { ...baseState, palette: 'not-a-real-palette' },
      { size: 100 },
    );

    expect(svg).toMatch(/fill="#0090ff"/);
    expect(svg).toMatch(/color: #ffffff/);
  });
});
