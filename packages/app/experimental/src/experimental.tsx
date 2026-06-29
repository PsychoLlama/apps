import { Show, onMount } from 'solid-js';
import { NotFound } from '@lib/shell';
import { useEffect } from '@lib/state';
import { Scratchpad } from './scratchpad';
import { experimentalFlag, loadExperimentalFlagEffect } from './state';

/**
 * The `/experimental` entry. The route SSGs unconditionally; this consults
 * the runtime flag at hydration and renders the scratchpad where it's
 * enabled (dev, staging), or the shared 404 where it isn't (production).
 *
 * Replaces the old build-time `INCLUDE_EXPERIMENTAL_APP` gate.
 */
export const Experimental = () => {
  const loadFlag = useEffect(loadExperimentalFlagEffect);
  onMount(() => void loadFlag());

  return (
    <Show when={experimentalFlag.enabled} fallback={<NotFound />}>
      <Scratchpad />
    </Show>
  );
};
