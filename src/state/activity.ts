const ACTIVITY_EXECUTOR: unique symbol = Symbol();

/** Opaque handle to an activity implementation. */
export interface ActivityDef<Args extends unknown[], Return> {
  readonly [ACTIVITY_EXECUTOR]: (...args: Args) => Return;
}

/** Options for activity definition. */
type ActivityOptions = Record<string, never>;

/** Define an activity. Activities are impure — side effects live here. */
export function defineActivity<Args extends unknown[], Return>(
  _options: ActivityOptions,
  executor: (...args: Args) => Return,
): ActivityDef<Args, Return> {
  return { [ACTIVITY_EXECUTOR]: executor };
}

/** Execute an activity. Internal — called by workflow context. */
export function executeActivity<Args extends unknown[], Return>(
  activity: ActivityDef<Args, Return>,
  ...args: Args
): Return {
  return activity[ACTIVITY_EXECUTOR](...args);
}
