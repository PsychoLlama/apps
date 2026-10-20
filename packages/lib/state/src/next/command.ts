import { concurrent, pipe, type Plan } from '@lib/effects';
import {
  defineExtension,
  type Commit,
  type ModeOfPlans,
  type Target,
} from './extension';
import { defineTopic, type Publish, type Topic } from './topic';

/**
 * Define a command: a topic that owns its commit. The plan yields the
 * publisher, so anything holding it can emit, and extensions can
 * subscribe to it like any topic.
 */
export const defineCommand = <
  const Targets extends readonly Target[],
  Args extends readonly unknown[],
>(
  targets: Targets,
  commit: Commit<Args, Targets>,
): Topic<Args, ModeOfPlans<Targets>> => {
  const $topic = defineTopic<Args>();

  // Holding the publisher holds the extension, so its commit is always
  // subscribed first. Generic steps defeat `pipe` inference; the
  // signature vouches.
  const $extension: Plan<[], unknown[]> = defineExtension(
    $topic,
    targets,
    commit,
  );

  return pipe([
    concurrent([$topic, $extension]),
    (publish: Publish<Args>) => publish,
  ]) as unknown as Topic<Args, ModeOfPlans<Targets>>;
};
