import { tokenize, tokenizeWithSplats } from '../tokenize.ts';
import { ident, literal, splat } from '../tokens.ts';

describe('tokenize', () => {
  it('returns nothing for empty text', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('keeps text without placeholders as one literal', () => {
    expect(tokenize('/about')).toEqual([literal('/about')]);
  });

  it('splits placeholders from the text around them', () => {
    expect(tokenize('/posts/:id')).toEqual([literal('/posts/'), ident('id')]);
    expect(tokenize(':id/edit')).toEqual([ident('id'), literal('/edit')]);
    expect(tokenize('/pre-:name.ext')).toEqual([
      literal('/pre-'),
      ident('name'),
      literal('.ext'),
    ]);
  });

  it('splits adjacent placeholders', () => {
    expect(tokenize(':a:b')).toEqual([ident('a'), ident('b')]);
  });

  it('allows letters, digits and underscores after a leading letter', () => {
    expect(tokenize(':a_1/:B2')).toEqual([
      ident('a_1'),
      literal('/'),
      ident('B2'),
    ]);
  });

  it('ends a placeholder at the first non-word character', () => {
    expect(tokenize(':x+(y)')).toEqual([ident('x'), literal('+(y)')]);
    expect(tokenize('[:splat]')).toEqual([
      literal('['),
      ident('splat'),
      literal(']'),
    ]);
  });

  it('treats a colon without a leading letter as a literal', () => {
    expect(tokenize('/:1a')).toEqual([literal('/:1a')]);
    expect(tokenize('https://x.test:8080/')).toEqual([
      literal('https://x.test:8080/'),
    ]);
    expect(tokenize('/::a')).toEqual([literal('/:'), ident('a')]);
  });

  it('treats `*` as a literal', () => {
    expect(tokenize('/a/*')).toEqual([literal('/a/*')]);
  });
});

describe('tokenizeWithSplats', () => {
  it('splits splats from the text around them', () => {
    expect(tokenizeWithSplats('/docs/*')).toEqual([literal('/docs/'), splat()]);
    expect(tokenizeWithSplats('/a/*/tail')).toEqual([
      literal('/a/'),
      splat(),
      literal('/tail'),
    ]);
  });

  it('ends a placeholder at a splat', () => {
    expect(tokenizeWithSplats('/:a*')).toEqual([
      literal('/'),
      ident('a'),
      splat(),
    ]);
  });

  // Rejecting more than one is up to the parser.
  it('splits each splat', () => {
    expect(tokenizeWithSplats('**')).toEqual([splat(), splat()]);
  });
});
