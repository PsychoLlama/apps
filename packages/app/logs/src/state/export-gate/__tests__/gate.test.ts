/**
 * Fold tests for the export gate: commit a fact, assert the state it lands.
 * No sagas and no capabilities are involved — what publishes each fact is
 * covered by the saga tests.
 */

import { createTestRuntime } from '@lib/state';
import { environment } from '@lib/runtime-config';
import {
  exportAvailableFormula,
  exportFlagChangedTopic,
  exportGateRestoredTopic,
  exportGateStore,
  workerControlChangedTopic,
} from '../gate';
import { logExport } from '../../../config';
import { logsScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(logsScope);
  return runtime;
};

describe('exportGateStore', () => {
  it("starts on the active environment's built-in default, uncontrolled", () => {
    const { peek } = setup();

    // Seeding the flag from its default is what keeps prerender and the
    // client's first paint in agreement; control can't be confirmed until the
    // page is live, so it starts out denied.
    expect(peek(exportGateStore)).toEqual({
      enabled: logExport.defaults[environment].enabled,
      controlled: false,
    });
  });

  it('takes both resolved conditions at once', () => {
    const { commit, peek } = setup();

    commit(exportGateRestoredTopic({ enabled: true, controlled: true }));

    expect(peek(exportGateStore)).toEqual({ enabled: true, controlled: true });
  });

  it('takes a flag change on its own', () => {
    const { commit, peek } = setup();
    commit(exportGateRestoredTopic({ enabled: false, controlled: true }));

    commit(exportFlagChangedTopic(true));

    expect(peek(exportGateStore)).toEqual({ enabled: true, controlled: true });
  });

  it('takes a control handoff on its own', () => {
    const { commit, peek } = setup();
    commit(exportGateRestoredTopic({ enabled: true, controlled: false }));

    commit(workerControlChangedTopic(true));

    expect(peek(exportGateStore)).toEqual({ enabled: true, controlled: true });
  });
});

describe('exportAvailableFormula', () => {
  it('offers the action only when both conditions hold', () => {
    const { commit, peek } = setup();

    commit(exportGateRestoredTopic({ enabled: true, controlled: true }));

    expect(peek(exportAvailableFormula)).toBe(true);
  });

  it.each([
    { enabled: true, controlled: false },
    { enabled: false, controlled: true },
    { enabled: false, controlled: false },
  ])('withholds the action given %o', (values) => {
    const { commit, peek } = setup();

    // Either condition alone is a dead button: an enabled feature with no
    // worker 404s, and a worker with the feature off has nothing to offer.
    commit(exportGateRestoredTopic(values));

    expect(peek(exportAvailableFormula)).toBe(false);
  });
});
