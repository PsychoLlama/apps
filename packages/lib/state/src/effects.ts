import {
  pipe,
  reactive,
  resource,
  type Flow,
  type Reactive,
  type Resource,
} from '@lib/effects';
import {
  SCOPE,
  type AnyWritableRef,
  type Runtime,
  type ScopeRef,
} from './internal';
import { anchorScope } from './scope';
import { resolveValue, type Snapshot } from './space';

/**
 * `@lib/effects` resources over a runtime's state, returned by
 * {@link bindEffects}. Each call builds a new effect, and the graph only
 * shares work between identical effects, so define them once at module
 * level and export them.
 */
export interface RuntimeEffects {
  /** An effect that holds a scope alive while it's held. */
  readonly anchored: (scope: ScopeRef) => Flow<[], [Resource<undefined>]>;

  /**
   * An effect that reads a store or cell, holding its scope alive while
   * it's held. Reads are tracked.
   */
  readonly observed: <Ref extends AnyWritableRef>(
    ref: Ref,
  ) => Flow<[], [Reactive<Snapshot<Ref>>]>;
}

/** Build the effects for a runtime. */
export const bindEffects = (runtime: Runtime): RuntimeEffects => {
  const anchored = (scope: ScopeRef) =>
    pipe([() => resource(undefined, anchorScope(runtime, scope))]);

  return {
    anchored,
    observed: <Ref extends AnyWritableRef>(ref: Ref) =>
      pipe([
        anchored(ref[SCOPE]),
        () => reactive(() => resolveValue(runtime, ref) as Snapshot<Ref>),
      ]),
  };
};
