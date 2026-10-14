import { parsePattern } from '../parse.ts';

describe('parsePattern', () => {
  it('accepts a static path', () => {
    expect(parsePattern('/about').source).toBe('/about');
  });

  it('accepts placeholders and a splat', () => {
    expect(parsePattern('/blog/:year/*').source).toBe('/blog/:year/*');
  });

  it('accepts a host with placeholders', () => {
    expect(parsePattern('https://:sub.example.com/*').source).toBe(
      'https://:sub.example.com/*',
    );
  });

  it('rejects a pattern that is neither a path nor an https URL', () => {
    expect(() => parsePattern('about')).toThrow();
    expect(() => parsePattern('http://example.com/')).toThrow();
  });

  // Cloudflare compiles every `*` to a group named `splat`. Two of them
  // can't coexist, so `_headers` rejects the rule and `_redirects` drops
  // it at runtime.
  it('rejects more than one splat', () => {
    expect(() => parsePattern('/a/*/*')).toThrow();
  });

  it('rejects a splat combined with a `:splat` placeholder', () => {
    expect(() => parsePattern('/a/*/:splat')).toThrow();
  });

  it('rejects a repeated placeholder', () => {
    expect(() => parsePattern('/:id/:id')).toThrow();
  });

  it('lists the vars a match binds', () => {
    expect(parsePattern('/about').vars).toEqual(new Set());
    expect(parsePattern('/blog/:year/*').vars).toEqual(
      new Set(['year', 'splat']),
    );
    expect(parsePattern('https://:sub.example.com/').vars).toEqual(
      new Set(['sub']),
    );
  });

  describe('var types', () => {
    it('infers no vars for a static path', () => {
      expectTypeOf(parsePattern('/about').vars).toEqualTypeOf<
        ReadonlySet<never>
      >();
    });

    it('infers placeholders and the splat', () => {
      expectTypeOf(parsePattern('/blog/:year/*').vars).toEqualTypeOf<
        ReadonlySet<'year' | 'splat'>
      >();
    });

    it('ends a name at the first non-word character', () => {
      expectTypeOf(parsePattern('/pre-:name.ext').vars).toEqualTypeOf<
        ReadonlySet<'name'>
      >();
      expectTypeOf(parsePattern('/:a_1/:B2+').vars).toEqualTypeOf<
        ReadonlySet<'a_1' | 'B2'>
      >();
    });

    it('ignores a colon without a leading letter', () => {
      expectTypeOf(parsePattern('/:1a').vars).toEqualTypeOf<
        ReadonlySet<never>
      >();
    });

    it('infers host placeholders', () => {
      expectTypeOf(
        parsePattern('https://:sub.example.com/*').vars,
      ).toEqualTypeOf<ReadonlySet<'sub' | 'splat'>>();
    });

    it('falls back to `string` for a pattern not known statically', () => {
      const source: string = '/:id';
      expectTypeOf(parsePattern(source).vars).toEqualTypeOf<
        ReadonlySet<string>
      >();
    });
  });
});
