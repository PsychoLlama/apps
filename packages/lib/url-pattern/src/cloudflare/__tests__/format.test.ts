import { format } from '../format.ts';

describe('format', () => {
  it('returns a template without references as-is', () => {
    expect(format('/about', {})).toBe('/about');
  });

  it('fills placeholders', () => {
    expect(format('https://x.test/id=:id', { id: 'abc' })).toBe(
      'https://x.test/id=abc',
    );
  });

  it('fills placeholders in any order', () => {
    expect(format('/:b/:a', { a: 'one', b: 'two' })).toBe('/two/one');
  });

  it('fills the splat', () => {
    expect(format('/new/:splat', { splat: 'a/b' })).toBe('/new/a/b');
  });

  it('fills a reference more than once', () => {
    expect(format('/:a/:a', { a: 'x' })).toBe('/x/x');
  });

  it('leaves references without a value as-is', () => {
    expect(format('/:missing/:splat', {})).toBe('/:missing/:splat');
  });

  it('leaves a `*` as-is', () => {
    expect(format('*', { splat: 'a' })).toBe('*');
  });

  it('fills references anywhere in the text', () => {
    expect(format('[:splat]', { splat: 'index.html' })).toBe('[index.html]');
  });

  it('keeps the query string and fragment', () => {
    expect(format('/d?from=:id#:id', { id: 'x' })).toBe('/d?from=x#x');
  });

  // Cloudflare fills each var with a plain string replace, in capture
  // order, so `:id` also rewrites the front of `:identity`. That's never
  // what the author meant, so `format` refuses instead of guessing.
  it('rejects a reference that starts with a shorter var name', () => {
    expect(() => format('/:identity/:id', { id: '42' })).toThrow();
    expect(() => format('/:identity', { id: '42', identity: 'x' })).toThrow();
  });

  it('allows a reference that is a prefix of a longer var name', () => {
    expect(format('/:id', { identity: 'x' })).toBe('/:id');
  });

  // Cloudflare's sequential replaces also fill references that an earlier
  // var's value introduced. Values come from the request URL, so
  // `format` fills the template in one pass and leaves values alone.
  it('does not fill references inside context values', () => {
    expect(format('/:a-:b', { a: ':b', b: 'zzz' })).toBe('/:b-zzz');
  });
});
