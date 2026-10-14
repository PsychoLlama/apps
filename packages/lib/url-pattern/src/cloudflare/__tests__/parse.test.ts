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

  describe('var types', () => {
    it('infers no vars for a static path', () => {
      expectTypeOf(parse('/about').vars).toEqualTypeOf<ReadonlySet<never>>();
    });

    it('infers placeholders and the splat', () => {
      expectTypeOf(parse('/blog/:year/*').vars).toEqualTypeOf<
        ReadonlySet<'year' | 'splat'>
      >();
    });

    it('ends a name at the first non-word character', () => {
      expectTypeOf(parse('/pre-:name.ext').vars).toEqualTypeOf<
        ReadonlySet<'name'>
      >();
      expectTypeOf(parse('/:a_1/:B2+').vars).toEqualTypeOf<
        ReadonlySet<'a_1' | 'B2'>
      >();
    });

    it('ignores a colon without a leading letter', () => {
      expectTypeOf(parse('/:1a').vars).toEqualTypeOf<ReadonlySet<never>>();
    });

    it('infers host placeholders', () => {
      expectTypeOf(parse('https://:sub.example.com/*').vars).toEqualTypeOf<
        ReadonlySet<'sub' | 'splat'>
      >();
    });

    it('falls back to `string` for a pattern not known statically', () => {
      const source: string = '/:id';
      expectTypeOf(parse(source).vars).toEqualTypeOf<ReadonlySet<string>>();
    });
  });
});
