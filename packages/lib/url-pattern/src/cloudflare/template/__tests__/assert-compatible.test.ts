import { compileMatcher } from '../../matcher/compile.ts';
import { assertCompatible, TemplateError } from '../assert-compatible.ts';
import { compileTemplate } from '../compile.ts';

const test = (template: string, pathname: string) => () =>
  assertCompatible(compileMatcher({ pathname }), compileTemplate(template));

describe('assertCompatible', () => {
  it('accepts references to bound vars', () => {
    expect(test('/archive/:year/:splat', '/blog/:year/*')).not.toThrow();
  });

  it('accepts a template that references nothing', () => {
    expect(test('/new', '/old/*')).not.toThrow();
  });

  it('accepts a template that leaves bound vars unused', () => {
    expect(test('/:b', '/:a/:b')).not.toThrow();
  });

  it('rejects a reference the matcher does not bind', () => {
    expect(test('/:missing', '/:id')).toThrow(TemplateError);
    expect(test('/:splat', '/about')).toThrow(TemplateError);
  });

  it('names the unbound reference', () => {
    expect(test('/:missing', '/:id')).toThrow(':missing');
  });

  // Cloudflare would fill `:id` here and leave `<id>x`.
  it('rejects a reference that only starts with a bound var', () => {
    expect(test('/:idx', '/:id')).toThrow(TemplateError);
  });

  // Matchers always bind the longer var first, so Cloudflare fills
  // `:identity` before `:id` can rewrite its front.
  it('accepts references to vars that prefix each other', () => {
    expect(test('/:identity/:id', '/:identity/:id')).not.toThrow();
  });

  describe('types', () => {
    it('rejects references the matcher does not bind', () => {
      const matcher = compileMatcher({ pathname: '/:id' });
      const illegal = () => {
        // @ts-expect-error — the matcher doesn't bind `missing`
        assertCompatible(matcher, compileTemplate('/:missing'));
      };
      void illegal;
    });

    it('accepts references the matcher binds', () => {
      const matcher = compileMatcher({ pathname: '/:a/:b' });
      const legal = () => assertCompatible(matcher, compileTemplate('/:b'));
      void legal;
    });

    it('defers to runtime for a template not known statically', () => {
      const source: string = '/:missing';
      const matcher = compileMatcher({ pathname: '/:id' });
      const legal = () => assertCompatible(matcher, compileTemplate(source));
      void legal;
    });
  });
});
