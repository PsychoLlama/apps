import type { Context } from '../../context.ts';
import { format, FormatError } from '../format.ts';
import { compileTemplate } from '../compile.ts';

const test = (template: string, context: Context) =>
  format(compileTemplate(template)[0], context);

describe('format', () => {
  it('returns a template without references as-is', () => {
    expect(test('/about', {})).toBe('/about');
  });

  it('fills references', () => {
    expect(test('https://x.test/id=:id', { id: 'abc' })).toBe(
      'https://x.test/id=abc',
    );
  });

  it('fills references in any order', () => {
    expect(test('/:b/:a', { a: 'one', b: 'two' })).toBe('/two/one');
  });

  it('fills the splat', () => {
    expect(test('/new/:splat', { splat: 'a/b' })).toBe('/new/a/b');
  });

  it('fills a reference more than once', () => {
    expect(test('/:a/:a', { a: 'x' })).toBe('/x/x');
  });

  it('leaves a `*` as-is', () => {
    expect(test('*', { splat: 'a' })).toBe('*');
  });

  it('fills references anywhere in the text', () => {
    expect(test('[:splat]', { splat: 'index.html' })).toBe('[index.html]');
  });

  it('keeps the query string and fragment', () => {
    expect(test('/d?from=:id#:id', { id: 'x' })).toBe('/d?from=x#x');
  });

  it('ignores context vars the template does not reference', () => {
    expect(test('/:id', { id: '42', identity: 'x' })).toBe('/42');
  });

  // Cloudflare's sequential replaces also fill references that an earlier
  // var's value introduced. Values come from the request URL, so `format`
  // fills the template in one pass and leaves values alone.
  it('does not fill references inside context values', () => {
    expect(test('/:a-:b', { a: ':b', b: 'zzz' })).toBe('/:b-zzz');
  });

  it('throws when the context is missing a referenced var', () => {
    expect(() => test('/:id', {})).toThrow(FormatError);
    expect(() => test('/:id', {})).toThrow(':id');
  });

  it('does not fill references from inherited keys', () => {
    expect(() => test('/:constructor', {})).toThrow(FormatError);
  });

  describe('types', () => {
    it('types the context by the template vars', () => {
      const [template] = compileTemplate('/:id/:splat');
      expectTypeOf(format<'id' | 'splat'>)
        .parameter(1)
        .toEqualTypeOf<Context<'id' | 'splat'>>();

      const illegal = () => {
        // @ts-expect-error — `splat` is missing
        format(template, { id: 'x' });
      };
      void illegal;
    });

    // A `match` result usually binds more than the template references.
    it('accepts a context with extra vars', () => {
      const context: Context<'id' | 'splat'> = { id: 'x', splat: 'y' };
      const legal = () => format(compileTemplate('/:id')[0], context);
      void legal;
    });
  });
});
