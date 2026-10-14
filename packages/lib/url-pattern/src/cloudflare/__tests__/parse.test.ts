import { parse } from '../parse.ts';

describe('parse', () => {
  it('accepts a static path', () => {
    expect(parse('/about').source).toBe('/about');
  });

  it('accepts placeholders and a splat', () => {
    expect(parse('/blog/:year/*').source).toBe('/blog/:year/*');
  });

  it('accepts a host with placeholders', () => {
    expect(parse('https://:sub.example.com/*').source).toBe(
      'https://:sub.example.com/*',
    );
  });

  it('rejects a pattern that is neither a path nor an https URL', () => {
    expect(() => parse('about')).toThrow();
    expect(() => parse('http://example.com/')).toThrow();
  });

  // Cloudflare compiles every `*` to a group named `splat`. Two of them
  // can't coexist, so `_headers` rejects the rule and `_redirects` drops
  // it at runtime.
  it('rejects more than one splat', () => {
    expect(() => parse('/a/*/*')).toThrow();
  });

  it('rejects a splat combined with a `:splat` placeholder', () => {
    expect(() => parse('/a/*/:splat')).toThrow();
  });

  it('rejects a repeated placeholder', () => {
    expect(() => parse('/:id/:id')).toThrow();
  });
});
