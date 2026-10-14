import { ident, literal } from '../../tokenize/tokens.ts';
import { compileTemplate, type CompiledTemplate } from '../compile.ts';

const vars = (source: string) => compileTemplate(source)[1];

describe('compileTemplate', () => {
  it('tokenizes the template', () => {
    expect(compileTemplate('/new/:splat')[0]).toEqual([
      literal('/new/'),
      ident('splat'),
    ]);
  });

  it('accepts any text', () => {
    expect(vars('https://x.test/a?b=:id#c')).toEqual(new Set(['id']));
    expect(vars('max-age=3600, public')).toEqual(new Set());
    expect(vars('')).toEqual(new Set());
  });

  it('lists the vars it references', () => {
    expect(vars('/:b/:a')).toEqual(new Set(['a', 'b']));
  });

  it('allows a repeated reference', () => {
    expect(vars('/:a/:a')).toEqual(new Set(['a']));
  });

  it('treats `*` as a literal', () => {
    expect(vars('*')).toEqual(new Set());
    expect(vars('/a/*')).toEqual(new Set());
  });

  it('references the splat only as `:splat`', () => {
    expect(vars('/new/:splat')).toEqual(new Set(['splat']));
  });

  it('ends an identifier at the first non-word character', () => {
    expect(vars('[:splat]')).toEqual(new Set(['splat']));
    expect(vars('/:a_1.:B2')).toEqual(new Set(['a_1', 'B2']));
  });

  it('treats a colon without a leading letter as a literal', () => {
    expect(vars('https://x.test:8080/:1a')).toEqual(new Set());
  });

  describe('types', () => {
    it('infers references', () => {
      expectTypeOf(compileTemplate('/:b/:a')).toEqualTypeOf<
        CompiledTemplate<'a' | 'b'>
      >();
    });

    it('does not infer a splat from `*`', () => {
      expectTypeOf(compileTemplate('/a/*')).toEqualTypeOf<
        CompiledTemplate<never>
      >();
      expectTypeOf(compileTemplate('/a/:splat')).toEqualTypeOf<
        CompiledTemplate<'splat'>
      >();
    });

    it('ignores a colon without a leading letter', () => {
      expectTypeOf(compileTemplate('https://x.test:8080/')).toEqualTypeOf<
        CompiledTemplate<never>
      >();
    });

    it('falls back to `string` for a template not known statically', () => {
      const source: string = '/:id';
      expectTypeOf(compileTemplate(source)).toEqualTypeOf<
        CompiledTemplate<string>
      >();
    });
  });
});
