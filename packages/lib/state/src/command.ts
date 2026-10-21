import { collect, type ModeOfSteps } from '@lib/effects';
import { writables, type Commit, type Target } from './extension';
import { defineTopic, subscribe, type Topic } from './topic';

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
): Topic<Args, ModeOfSteps<readonly [Topic<Args, 'sync'>, ...Targets]>> =>
  // The commit subscribes in the node that yields the publisher, so it's
  // always subscribed before any extension downstream.
  collect(
    [defineTopic<Args>(), ...targets],
    subscribe(
      (...yields) => commit(...writables<Targets>(yields)),
      (publish) => publish,
    ),
  );
