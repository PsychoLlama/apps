import type { Commit, Target, ModeOfPlans } from './change';
import type { Topic } from './topic';
import { unimplemented } from './unimplemented';

/**
 * Define a topic with a change already subscribed. The plan yields the
 * publisher, so anything holding it can emit, and other changes can
 * subscribe to it like any topic.
 */
export const defineAction = <
  const Targets extends readonly Target[],
  Args extends readonly unknown[],
>(
  targets: Targets,
  commit: Commit<Args, Targets>,
): Topic<Args, ModeOfPlans<Targets>> => unimplemented(targets, commit);
