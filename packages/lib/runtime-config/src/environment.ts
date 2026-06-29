import { type Environment } from './define-option';

/**
 * Vite build modes mapped to their deploy environment. `development`
 * (the dev server) and `production` (`vite build`) are Vite's intrinsic
 * defaults; `staging` is passed explicitly (`--mode staging`) by the CI
 * preview build.
 */
const ENVIRONMENT_BY_MODE: Record<string, Environment> = {
  development: 'dev',
  staging: 'staging',
  production: 'prod',
};

/**
 * Resolve a deploy {@link Environment} from a Vite mode. Falls back to
 * `dev` for any unrecognized mode — notably vitest's `test` — so
 * non-deployed contexts behave like local development.
 */
export const resolveEnvironment = (mode: string): Environment =>
  ENVIRONMENT_BY_MODE[mode] ?? 'dev';

/**
 * The deploy environment this build targets. Derived from Vite's
 * intrinsic `import.meta.env.MODE`, which is statically replaced in
 * every output, so the value is correct in every context the bundle
 * runs in — SSG prerender, the Worker, the service worker, and the
 * client alike.
 *
 * Use it to select the active value from an option's per-environment
 * map (e.g. the result of {@link read}).
 */
export const environment: Environment = resolveEnvironment(
  import.meta.env.MODE,
);
