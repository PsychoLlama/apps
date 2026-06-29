import { read } from '@lib/runtime-config';
import { experimentalOption } from './flag';

/**
 * Read the experimental flag's per-environment config — its defaults with
 * any persisted runtime override layered on. Resolves over OPFS, so it's
 * client-only; during SSG it falls back to the bare defaults.
 */
export const readExperimentalConfig = () => read(experimentalOption);
