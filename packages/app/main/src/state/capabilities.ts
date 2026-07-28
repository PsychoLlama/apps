import { readEnvironment, subscribe, watchAll } from '@lib/runtime-config';
import { enabled as beamAppEnabled } from '@app/beam/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { type LauncherFlagsState } from './flags';

/**
 * Resolve every gated app's visibility for the active environment in one
 * pass, layering any persisted OPFS override over each option's default.
 * Reads run concurrently so hydration is a single round-trip.
 */
export const readLauncherFlags = async (): Promise<LauncherFlagsState> => {
  const [beam, scratchpad] = await Promise.all([
    readEnvironment(beamAppEnabled),
    readEnvironment(scratchpadAppEnabled),
  ]);

  return {
    beamEnabled: beam.enabled,
    scratchpadEnabled: scratchpad.enabled,
  };
};

/** One gated app settling on a new resolved visibility. */
export type LauncherFlagChange =
  { app: 'beam'; enabled: boolean } | { app: 'scratchpad'; enabled: boolean };

/**
 * Watch both gated apps at once, reporting each resolved value as it
 * lands. Changes from any browsing context arrive here — the settings
 * page's Advanced toggles, sibling tabs, workers — which is what keeps the
 * launcher's card list in step without polling.
 *
 * See {@link watchAll} for the buffering and teardown guarantees the
 * stream carries.
 */
export const watchLauncherFlags = (
  signal: AbortSignal,
): AsyncGenerator<LauncherFlagChange> =>
  watchAll(signal, (push) => [
    subscribe(beamAppEnabled, ({ enabled }) => push({ app: 'beam', enabled })),
    subscribe(scratchpadAppEnabled, ({ enabled }) =>
      push({ app: 'scratchpad', enabled }),
    ),
  ]);
