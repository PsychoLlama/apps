/**
 * The git ref the production deploy runs off of. Mirrors the GitHub
 * workflow's own production gate (`github.ref == 'refs/heads/main'`),
 * so build-time decisions here stay in lockstep with what actually
 * ships to production.
 */
export const PRODUCTION_GIT_REF = 'refs/heads/main';

/**
 * Whether the experimental scratchpad app is part of this build's
 * release, given the git ref the build runs against. It ships
 * everywhere *except* production — PR previews and local builds (where
 * the ref is anything other than `main`, or unset) keep it reachable,
 * the production build omits it.
 *
 * Pure on purpose: the caller reads the ref from the environment so
 * this stays trivially testable and turbo-cacheable. App code should
 * consume the inlined `import.meta.env` constant the host's vite config
 * defines from this, not call it directly.
 */
export const includesExperimentalApp = (ref: string | undefined): boolean =>
  ref !== PRODUCTION_GIT_REF;
