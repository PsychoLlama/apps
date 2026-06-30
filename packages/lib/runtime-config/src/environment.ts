import { ENVIRONMENTS, type Environment } from './define-config';

/** The environment non-deployed contexts (e.g. vitest's `test`) fall back to. */
const DEFAULT_ENVIRONMENT: Environment = 'development';

/**
 * Resolve a deploy {@link Environment} from a Vite mode. Our environments
 * are named to match Vite's modes one-to-one (`vite build` → `production`,
 * `--mode staging` → `staging`, the dev server → `development`), so this is
 * an identity for deployed builds. Any unrecognized mode — notably vitest's
 * `test` — falls back to `development`, so non-deployed contexts behave like
 * local development.
 */
export const resolveEnvironment = (mode: string): Environment =>
  (ENVIRONMENTS as readonly string[]).includes(mode)
    ? (mode as Environment)
    : DEFAULT_ENVIRONMENT;

/**
 * The deploy environment this build targets. Derived from Vite's
 * intrinsic `import.meta.env.MODE`, which is statically replaced in
 * every output, so the value is correct in every context the bundle
 * runs in — SSG prerender, the Worker, the service worker, and the
 * client alike.
 *
 * Use it to select the active value from an option's per-environment
 * map (e.g. the result of {@link readEnvironment}).
 */
export const environment: Environment = resolveEnvironment(
  import.meta.env.MODE,
);
