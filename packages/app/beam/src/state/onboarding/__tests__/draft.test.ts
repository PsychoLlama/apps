/**
 * Unit tests for what the setup form holds. The draft lives in the scope
 * rather than the field precisely so it can outlive the form, and these are
 * about which events it survives.
 */

import { createTestRuntime } from '@lib/state';
import { setupDraftStore, setupNameChangedTopic } from '../draft';
import { deviceLoadFailedTopic, deviceNamedTopic } from '../../device/device';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('setupDraftStore', () => {
  it('starts empty, so the button starts disabled', () => {
    const { peek } = setup();

    expect(peek(setupDraftStore).name).toBe('');
  });

  it('holds the name exactly as typed', () => {
    const { commit, peek } = setup();

    commit(setupNameChangedTopic('  Carol’s Ph'));

    // Unnormalized. Trimming under the caret would fight whoever is typing,
    // and someone mid-word has trailing space on purpose.
    expect(peek(setupDraftStore).name).toBe('  Carol’s Ph');
  });

  it('keeps the name when nothing landed', () => {
    const { commit, peek } = setup();
    commit(setupNameChangedTopic('Carol’s Phone'));

    commit(deviceLoadFailedTopic());

    // The form is rebuilt around the draft on anything short of success.
    // Making them retype what they just typed would be the app's mistake,
    // twice.
    expect(peek(setupDraftStore).name).toBe('Carol’s Phone');
  });

  it('lets the name go once it belongs to the device', () => {
    const { commit, peek } = setup();
    commit(setupNameChangedTopic('Carol’s Phone'));

    commit(deviceNamedTopic('Carol’s Phone'));

    expect(peek(setupDraftStore).name).toBe('');
  });
});
