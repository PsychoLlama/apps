import { PRODUCTION_GIT_REF, includesExperimentalApp } from '../release.ts';

describe('includesExperimentalApp', () => {
  it('excludes the experimental app on the production ref', () => {
    expect(includesExperimentalApp(PRODUCTION_GIT_REF)).toBe(false);
  });

  it('includes it for preview branches', () => {
    expect(includesExperimentalApp('refs/heads/some-feature')).toBe(true);
  });

  it('includes it for local builds with no ref set', () => {
    expect(includesExperimentalApp(undefined)).toBe(true);
  });
});
