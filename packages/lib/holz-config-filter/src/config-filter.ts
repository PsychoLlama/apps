import type { LogProcessor } from '@holz/core';
import { createPatternFilter } from '@holz/pattern-filter';
import { createLogValve } from '@lib/holz-valve';
import {
  environment,
  readEnvironment,
  subscribe,
  type Option,
} from '@lib/runtime-config';

/**
 * A runtime-config option whose value carries the holz pattern string. The
 * filter reads `pattern` and hands it to `@holz/pattern-filter`, so the
 * option's per-environment defaults are where you set "on in dev, silent in
 * prod" — the OPFS override then layers a live value on top.
 */
export type ConfigFilterOption = Option<{ pattern: string }>;

/** Options for {@link createConfigFilter}. */
export interface CreateConfigFilterOptions {
  /**
   * The pattern source. Passed by instance (not just its current value) so
   * the filter owns the read and the subscription — it reacts to changes for
   * its whole lifetime rather than capturing a snapshot at construction.
   */
  option: ConfigFilterOption;

  /** Where logs go once they pass the filter. */
  processor: LogProcessor;

  /**
   * How many logs to hold while the first pattern read is in flight. Forwarded
   * to the valve's ring buffer; defaults to unbounded. The window is brief (a
   * single OPFS read), so the default rarely matters — cap it if a flood at
   * startup is a concern.
   */
  capacity?: number;
}

/**
 * Filter holz logs by a `@lib/runtime-config` pattern. A drop-in alternative
 * to `@holz/env-filter` with two differences that matter here:
 *
 * - **Reactive.** It {@link subscribe}s to the option and swaps in a fresh
 *   pattern filter on every change (a pattern filter bakes its pattern at
 *   construction, so "update" means "replace"), so a pattern flipped
 *   anywhere — this tab, another tab, or a worker — takes effect without a
 *   reload.
 * - **Reachable.** The pattern lives in OPFS, which workers and service
 *   workers can read — unlike the `localStorage` `@holz/env-filter` depends
 *   on. That lets production logging be enabled live while troubleshooting,
 *   in realms the env filter can't reach.
 *
 * Reads are async, so logs emitted before the first read resolves are held in
 * a {@link createLogValve} and drained once the pattern is known.
 */
export const createConfigFilter = ({
  option,
  processor,
  capacity,
}: CreateConfigFilterOptions): LogProcessor => {
  // The live pattern filter, replaced whenever the option changes. The valve
  // routes through this indirection rather than a fixed processor so a swap
  // takes effect for the next log. Never invoked before it's set: the valve
  // stays closed (buffering) until the first read seeds it.
  let filter: LogProcessor = () => {};
  const setPattern = (pattern: string): void => {
    filter = createPatternFilter({ pattern, processor });
  };

  // Buffer until we know the pattern. Both the streaming path (per log, while
  // open) and the drain (the buffered batch) route through the current filter.
  const valve = createLogValve({
    open: false,
    capacity,
    processor: (log) => filter(log),
    drain: (logs) => {
      for (const log of logs) filter(log);
    },
  });

  // Seed from the persisted value, then release the buffer. `readEnvironment`
  // already degrades every recoverable case to the option's default (OPFS
  // absent, walled off, denied, or a corrupt file), so it only rejects on a
  // genuinely unexpected fault. The rejection branch is a liveness backstop
  // for that residual case: fall back to the default and open regardless, so
  // an unforeseen error can never strand logs in the buffer forever.
  void readEnvironment(option)
    .then(
      (value) => value.pattern,
      () => option.defaults[environment].pattern,
    )
    .then((pattern) => {
      setPattern(pattern);
      valve.open();
    });

  // Track changes for the filter's lifetime. `subscribe` fires for every
  // context — this tab, sibling tabs, workers — so a pattern flipped anywhere
  // is live, no reload.
  subscribe(option, (value) => {
    setPattern(value.pattern);
  });

  return valve.processor;
};
