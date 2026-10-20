import { concurrent, pipe, type Plan } from '@lib/effects';
import {
  defineChange,
  type Commit,
  type ModeOfPlans,
  type Target,
} from './change';
import { defineTopic, type Publish, type Topic } from './topic';

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
): Topic<Args, ModeOfPlans<Targets>> => {
  const $topic = defineTopic<Args>();

  // Holding the publisher holds the change, so its commit is always
  // subscribed first. Generic steps defeat `pipe` inference; the
  // signature vouches.
  const $change: Plan<[], unknown[]> = defineChange($topic, targets, commit);

  return pipe([
    concurrent([$topic, $change]),
    (publish: Publish<Args>) => publish,
  ]) as unknown as Topic<Args, ModeOfPlans<Targets>>;
};
