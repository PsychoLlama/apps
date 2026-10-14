import { format } from '../format.ts';
import type { Context } from '../match.ts';
import { parse } from '../parse.ts';

describe('format', () => {
  it('returns a template without references as-is', () => {
    expect(format(parse('/about'), '/about')({})).toBe('/about');
  });

  it('fills placeholders', () => {
    const fill = format(parse('/:id'), 'https://x.test/id=:id');
    expect(fill({ id: 'abc' })).toBe('https://x.test/id=abc');
  });

  it('fills placeholders in any order', () => {
    const fill = format(parse('/:a/:b'), '/:b/:a');
    expect(fill({ a: 'one', b: 'two' })).toBe('/two/one');
  });

  it('fills the splat', () => {
    const fill = format(parse('/old/*'), '/new/:splat');
    expect(fill({ splat: 'a/b' })).toBe('/new/a/b');
  });

  it('fills a reference more than once', () => {
    expect(format(parse('/:a'), '/:a/:a')({ a: 'x' })).toBe('/x/x');
  });

  it('leaves a `*` as-is', () => {
    expect(format(parse('/*'), '*')({ splat: 'a' })).toBe('*');
  });

  it('fills references anywhere in the text', () => {
    const fill = format(parse('/*'), '[:splat]');
    expect(fill({ splat: 'index.html' })).toBe('[index.html]');
  });

  it('keeps the query string and fragment', () => {
    const fill = format(parse('/:id'), '/d?from=:id#:id');
    expect(fill({ id: 'x' })).toBe('/d?from=x#x');
  });

  it('rejects a reference the pattern does not bind', () => {
    expect(() => format(parse('/:id'), '/:missing')).toThrow();
    expect(() => format(parse('/about'), '/:splat')).toThrow();
  });

  // Cloudflare fills each var with a plain string replace, in capture
  // order, so `:id` also rewrites the front of `:identity`. That's never
  // what the author meant, so `format` refuses instead of guessing.
  it('rejects a reference that starts with a shorter var name', () => {
    expect(() => format(parse('/:id/:identity'), '/:identity')).toThrow();
  });

  it('allows a reference that is a prefix of a longer var name', () => {
    const fill = format(parse('/:id/:identity'), '/:id');
    expect(fill({ id: '42', identity: 'x' })).toBe('/42');
  });

  // Cloudflare's sequential replaces also fill references that an earlier
  // var's value introduced. Values come from the request URL, so `format`
  // fills the template in one pass and leaves values alone.
  it('does not fill references inside context values', () => {
    const fill = format(parse('/:a/:b'), '/:a-:b');
    expect(fill({ a: ':b', b: 'zzz' })).toBe('/:b-zzz');
  });

  it('types the context by the pattern vars', () => {
    expectTypeOf(format(parse('/:id/*'), '/x'))
      .parameter(0)
      .toEqualTypeOf<Context<'id' | 'splat'>>();
  });
});
