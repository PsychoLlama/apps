import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  type Accessor,
} from 'solid-js';

/** Inputs to {@link useExclusive}. */
export interface ExclusiveInputs {
  /** Identifies this tooltip among every other on the page. */
  id: string;

  /** Whether this tooltip is showing. */
  showing: Accessor<boolean>;

  /** Hides this tooltip once another has started showing. */
  onSuperseded: () => void;
}

// The tooltip showing on the page, by id, or `null` when none is.
// Module-wide rather than in a context: there's one page, and a
// provider would be one more thing for a call site to remember. Only
// ever written from the client's events, so the server never carries
// one render's tooltip into the next.
const [holder, setHolder] = createSignal<string | null>(null);

/**
 * One tooltip on the page at a time: showing claims the page, and a
 * claim by any other tooltip supersedes this one. Progressive
 * enhancement only — without script, every tooltip opens on its own.
 */
export const useExclusive = (inputs: ExclusiveInputs): void => {
  // Released only while it's still ours. A tooltip hiding because a
  // newer one took over must not take the newer one's claim with it.
  const release = () => {
    if (holder() === inputs.id) setHolder(null);
  };

  createEffect(
    on(inputs.showing, (showing) => {
      if (showing) setHolder(inputs.id);
      else release();
    }),
  );

  createEffect(
    on(
      holder,
      (current) => {
        if (current !== inputs.id && inputs.showing()) inputs.onSuperseded();
      },
      { defer: true },
    ),
  );

  onCleanup(release);
};
