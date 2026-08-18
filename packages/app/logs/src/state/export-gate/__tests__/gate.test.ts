/**
 * Fold tests for the export gate: commit a fact, assert the state it lands.
 * No sagas and no capabilities are involved — what publishes each fact is
 * covered by the saga tests.
 */

import { createTestRuntime } from '@lib/state';
import {
  exportAvailableFormula,
  exportGateStore,
  workerControlChangedTopic,
} from '../gate';
import { logsScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(logsScope);
  return runtime;
};

describe('exportGateStore', () => {
  it('starts uncontrolled', () => {
    const { peek } = setup();

    // Control can't be confirmed until the page is live, so it starts out
    // denied — which is also what prerender renders.
    expect(peek(exportGateStore)).toEqual({ controlled: false });
  });

  it('takes a control handoff', () => {
    const { commit, peek } = setup();

    commit(workerControlChangedTopic(true));

    expect(peek(exportGateStore)).toEqual({ controlled: true });
  });
});

describe('exportAvailableFormula', () => {
  it('offers the action once a worker controls the page', () => {
    const { commit, peek } = setup();

    commit(workerControlChangedTopic(true));

    expect(peek(exportAvailableFormula)).toBe(true);
  });

  it('withholds the action while nothing controls the page', () => {
    const { commit, peek } = setup();

    // Without a worker the export navigation escapes to the network and
    // 404s: a dead button.
    commit(workerControlChangedTopic(false));

    expect(peek(exportAvailableFormula)).toBe(false);
  });
});
