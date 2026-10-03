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

/** What {@link useExclusive} hands back. */
export interface Exclusive {
  /**
   * Whether a tooltip on the page was showing a moment ago, so the
   * reader is already looking at tooltips and the next can skip its
   * wait.
   */
  warm: Accessor<boolean>;
}

/** How long the page stays warm after the last tooltip goes. */
const SKIP_DELAY_MS = 300;

// The tooltip showing on the page, by id, or `null` when none is.
// Module-wide rather than in a context: there's one page, and a
// provider would be one more thing for a call site to remember. Only
// ever written from the client's events, so the server never carries
// one render's tooltip into the next.
const [holder, setHolder] = createSignal<string | null>(null);

// Whether a tooltip was showing a moment ago. Warms with every claim,
// and cools once the page has gone `SKIP_DELAY_MS` without one.
const [warm, setWarm] = createSignal(false);
let cooling: ReturnType<typeof setTimeout> | undefined;

const cool = () => {
  clearTimeout(cooling);
  cooling = undefined;
  setWarm(false);
};

const claim = (id: string) => {
  clearTimeout(cooling);
  cooling = undefined;
  setHolder(id);
  setWarm(true);
};

const vacate = () => {
  setHolder(null);
  clearTimeout(cooling);
  cooling = setTimeout(cool, SKIP_DELAY_MS);
};

/**
 * Tests only. Cools the page now if it's on its way to cooling, rather
 * than after the skip delay; a page that's still warm for a reason —
 * a tooltip up — stays warm.
 */
export const __testingFlushCooling = (): void => {
  if (cooling !== undefined) cool();
};

/**
 * One tooltip on the page at a time: showing claims the page, and a
 * claim by any other tooltip supersedes this one. Shortly after one
 * shows, the rest skip their wait. Progressive enhancement only —
 * without script, every tooltip opens on its own and every hover
 * waits.
 */
export const useExclusive = (inputs: ExclusiveInputs): Exclusive => {
  // Released only while it's still ours. A tooltip hiding because a
  // newer one took over must not take the newer one's claim with it,
  // or start the page cooling under it.
  const release = () => {
    if (holder() === inputs.id) vacate();
  };

  createEffect(
    on(inputs.showing, (showing) => {
      if (showing) claim(inputs.id);
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

  return { warm };
};
