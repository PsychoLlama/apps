import { compileMatcher, MatcherError } from '../compile.ts';

const compile = (pathname: string) => compileMatcher({ pathname });

describe('compileMatcher', () => {
  // Cloudflare's engine compiles anything as an anchored path, even text
  // that can never match one.
  it('accepts a pathname without a leading slash', () => {
    expect(() => compile('about')).not.toThrow();
  });

  // Cloudflare compiles every `*` to a group named `splat`. Two of them
  // can't coexist, so `_headers` rejects the rule and `_redirects` drops
  // it at runtime.
  it('rejects more than one splat', () => {
    expect(() => compile('/a/*/*')).toThrow(MatcherError);
  });

  it('rejects a splat combined with a `:splat` placeholder', () => {
    expect(() => compile('/a/*/:splat')).toThrow(MatcherError);
    expect(() => compile('/:splat/*')).toThrow(MatcherError);
  });

  it('rejects a repeated placeholder', () => {
    expect(() => compile('/:id/:id')).toThrow(MatcherError);
  });

  // Cloudflare replaces each placeholder in order with a plain string
  // replace, so `:id` also rewrites the front of a later `:identity` and
  // leaves two `id` groups. The other order compiles fine.
  it('rejects a placeholder that a shorter, earlier one prefixes', () => {
    expect(() => compile('/:id/:identity')).toThrow(MatcherError);
    expect(compile('/:identity/:id')[1]).toEqual(new Set(['identity', 'id']));
  });

  it('keeps the source on errors', () => {
    expect(() => compile('/:id/:id')).toThrow(
      expect.objectContaining({ source: '/:id/:id' }),
    );
  });

  it('lists the vars a match binds', () => {
    expect(compile('/about')[1]).toEqual(new Set());
    expect(compile('/blog/:year/*')[1]).toEqual(new Set(['year', 'splat']));
  });

  describe('regex', () => {
    const regex = (pathname: string) =>
      new RegExp(compile(pathname)[0].pathname);

    it('is anchored', () => {
      expect(regex('/a').test('/a')).toBe(true);
      expect(regex('/a').test('/a/b')).toBe(false);
      expect(regex('/a').test('/b/a')).toBe(false);
    });

    it('escapes literal text', () => {
      expect(regex('/a+b(c).d').test('/a+b(c).d')).toBe(true);
      expect(regex('/a+b(c).d').test('/aab(c)xd')).toBe(false);
    });

    it('names a group per var', () => {
      expect(regex('/:year/*').exec('/2026/a/b')?.groups).toEqual({
        year: '2026',
        splat: 'a/b',
      });
    });
  });

  it('mirrors the init in its regex types', () => {
    expectTypeOf(compileMatcher({ pathname: '/:id' })[0]).toEqualTypeOf<{
      readonly pathname: string;
    }>();
  });

  describe('var types', () => {
    it('infers no vars for a static path', () => {
      expectTypeOf(compileMatcher({ pathname: '/about' })[1]).toEqualTypeOf<
        ReadonlySet<never>
      >();
    });

    it('infers placeholders and the splat', () => {
      expectTypeOf(
        compileMatcher({ pathname: '/blog/:year/*' })[1],
      ).toEqualTypeOf<ReadonlySet<'year' | 'splat'>>();
    });

    it('ends a name at the first non-word character', () => {
      expectTypeOf(
        compileMatcher({ pathname: '/pre-:name.ext' })[1],
      ).toEqualTypeOf<ReadonlySet<'name'>>();
      expectTypeOf(compileMatcher({ pathname: '/:a_1/:B2+' })[1]).toEqualTypeOf<
        ReadonlySet<'a_1' | 'B2'>
      >();
    });

    it('ignores a colon without a leading letter', () => {
      expectTypeOf(compileMatcher({ pathname: '/:1a' })[1]).toEqualTypeOf<
        ReadonlySet<never>
      >();
    });

    it('falls back to `string` for a pattern not known statically', () => {
      const pathname: string = '/:id';
      expectTypeOf(compileMatcher({ pathname })[1]).toEqualTypeOf<
        ReadonlySet<string>
      >();
    });
  });
});
