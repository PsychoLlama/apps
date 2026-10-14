import { compilePattern } from '../../pattern/compile.ts';
import { parseTemplate, type Template } from '../parse.ts';

describe('parseTemplate', () => {
  it('keeps the source', () => {
    expect(parseTemplate('/new/:splat').source).toBe('/new/:splat');
  });

  it('accepts any text', () => {
    expect(parseTemplate('https://x.test/a?b=:id#c').vars).toEqual(
      new Set(['id']),
    );
    expect(parseTemplate('max-age=3600, public').vars).toEqual(new Set());
    expect(parseTemplate('').vars).toEqual(new Set());
  });

  it('lists the vars it references', () => {
    expect(parseTemplate('/:b/:a').vars).toEqual(new Set(['a', 'b']));
  });

  it('allows a repeated reference', () => {
    expect(parseTemplate('/:a/:a').vars).toEqual(new Set(['a']));
  });

  it('treats `*` as a literal', () => {
    expect(parseTemplate('*').vars).toEqual(new Set());
    expect(parseTemplate('/a/*').vars).toEqual(new Set());
  });

  it('references the splat only as `:splat`', () => {
    expect(parseTemplate('/new/:splat').vars).toEqual(new Set(['splat']));
  });

  it('ends an identifier at the first non-word character', () => {
    expect(parseTemplate('[:splat]').vars).toEqual(new Set(['splat']));
    expect(parseTemplate('/:a_1.:B2').vars).toEqual(new Set(['a_1', 'B2']));
  });

  it('treats a colon without a leading letter as a literal', () => {
    expect(parseTemplate('https://x.test:8080/:1a').vars).toEqual(new Set());
  });

  describe('in a scope', () => {
    const test = (template: string, pattern: string) => () =>
      parseTemplate(template, compilePattern({ pathname: pattern }));

    it('accepts references to bound vars', () => {
      expect(test('/archive/:year/:splat', '/blog/:year/*')).not.toThrow();
    });

    it('accepts a template that references nothing', () => {
      expect(test('/new', '/old/*')).not.toThrow();
    });

    it('accepts a template that leaves bound vars unused', () => {
      expect(test('/:b', '/:a/:b')).not.toThrow();
    });

    it('rejects a reference the pattern does not bind', () => {
      expect(test('/:missing', '/:id')).toThrow();
      expect(test('/:splat', '/about')).toThrow();
    });

    // Cloudflare would fill `:id` here and leave `<id>x`.
    it('rejects a reference that only starts with a bound var', () => {
      expect(test('/:idx', '/:id')).toThrow();
    });

    // Patterns always bind the longer var first, so Cloudflare fills
    // `:identity` before `:id` can rewrite its front.
    it('accepts references to vars that prefix each other', () => {
      expect(test('/:identity/:id', '/:identity/:id')).not.toThrow();
    });

    describe('types', () => {
      it('rejects references the pattern does not bind', () => {
        const pattern = compilePattern({ pathname: '/:id' });
        const illegal = () => {
          // @ts-expect-error — the pattern doesn't bind `missing`
          parseTemplate('/:missing', pattern);
        };
        void illegal;
      });

      it('infers the referenced vars', () => {
        const pattern = compilePattern({ pathname: '/:a/:b' });
        const legal = () => parseTemplate('/:b', pattern);
        expectTypeOf(legal).returns.toEqualTypeOf<Template<'b'>>();
      });

      it('narrows a template not known statically to the pattern vars', () => {
        const source: string = '/:a';
        const pattern = compilePattern({ pathname: '/:a/:b' });
        const legal = () => parseTemplate(source, pattern);
        expectTypeOf(legal).returns.toEqualTypeOf<Template<'a' | 'b'>>();
      });
    });
  });

  describe('var types', () => {
    it('infers references', () => {
      expectTypeOf(parseTemplate('/:b/:a').vars).toEqualTypeOf<
        ReadonlySet<'a' | 'b'>
      >();
    });

    it('does not infer a splat from `*`', () => {
      expectTypeOf(parseTemplate('/a/*').vars).toEqualTypeOf<
        ReadonlySet<never>
      >();
      expectTypeOf(parseTemplate('/a/:splat').vars).toEqualTypeOf<
        ReadonlySet<'splat'>
      >();
    });

    it('ignores a colon without a leading letter', () => {
      expectTypeOf(parseTemplate('https://x.test:8080/').vars).toEqualTypeOf<
        ReadonlySet<never>
      >();
    });

    it('falls back to `string` for a template not known statically', () => {
      const source: string = '/:id';
      expectTypeOf(parseTemplate(source).vars).toEqualTypeOf<
        ReadonlySet<string>
      >();
    });
  });
});
