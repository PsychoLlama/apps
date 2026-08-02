/**
 * Fold tests for the Advanced section: commit a fact, assert the state it
 * lands. No sagas and no OPFS — what publishes each fact is covered by the
 * saga tests.
 */

import { createTestRuntime } from '@lib/state';
import { advancedSettingsScope } from '../scope';
import {
  advancedDefaults,
  advancedSettingsRestoredTopic,
  advancedSettingsStore,
  logExportChangedTopic,
  logFilterChangedTopic,
  scratchpadChangedTopic,
  type AdvancedSettingsState,
} from '../settings';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(advancedSettingsScope);
  return runtime;
};

/** Every option flipped away from whatever the environment defaults to. */
const inverted: AdvancedSettingsState = {
  logFilter: `${advancedDefaults.logFilter}:changed`,
  logExportEnabled: !advancedDefaults.logExportEnabled,
  scratchpadEnabled: !advancedDefaults.scratchpadEnabled,
};

describe('advancedSettingsStore', () => {
  it("starts on the active environment's defaults so SSG can render it", () => {
    const { peek } = setup();

    expect(peek(advancedSettingsStore)).toEqual(advancedDefaults);
  });

  it('takes every persisted override in one transition', () => {
    const { commit, peek } = setup();

    commit(advancedSettingsRestoredTopic(inverted));

    expect(peek(advancedSettingsStore)).toEqual(inverted);
  });

  it('takes a resolved log filter pattern', () => {
    const { commit, peek } = setup();

    commit(logFilterChangedTopic('app:*'));

    expect(peek(advancedSettingsStore).logFilter).toBe('app:*');
  });

  it('takes a resolved logs export flag', () => {
    const { commit, peek } = setup();

    commit(logExportChangedTopic(!advancedDefaults.logExportEnabled));

    expect(peek(advancedSettingsStore).logExportEnabled).toBe(
      !advancedDefaults.logExportEnabled,
    );
  });

  it('takes a resolved scratchpad flag', () => {
    const { commit, peek } = setup();

    commit(scratchpadChangedTopic(!advancedDefaults.scratchpadEnabled));

    expect(peek(advancedSettingsStore).scratchpadEnabled).toBe(
      !advancedDefaults.scratchpadEnabled,
    );
  });

  it('leaves the other options alone when one changes', () => {
    const { commit, peek } = setup();

    commit(logFilterChangedTopic('app:*'));

    expect(peek(advancedSettingsStore)).toEqual({
      ...advancedDefaults,
      logFilter: 'app:*',
    });
  });
});
