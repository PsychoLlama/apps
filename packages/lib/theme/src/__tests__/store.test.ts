/**
 * Fold tests for the appearance preferences: commit a fact, assert the
 * state it lands. No sagas and no capabilities are involved — what
 * publishes each fact is covered by the saga tests, and the DOM /
 * localStorage writes by the capability tests.
 */

import { createTestRuntime } from '@lib/state-next';
import { DEFAULT_THEME_ID } from '../constants';
import { themeScope } from '../scope';
import {
  colorSchemeRestoredTopic,
  colorSchemeSelectedTopic,
  colorSchemeStore,
  motionRestoredTopic,
  motionSelectedTopic,
  motionStore,
  themeResetTopic,
  themeRestoredTopic,
  themeSelectedTopic,
  themeStore,
} from '../store';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(themeScope);
  return runtime;
};

describe('themeStore', () => {
  it('starts unhydrated so SSG can render with no selection', () => {
    const { peek } = setup();

    expect(peek(themeStore).id).toBeNull();
  });

  it('takes the theme the prelude stamped on <html>', () => {
    const { commit, peek } = setup();

    commit(themeRestoredTopic('pink'));

    expect(peek(themeStore).id).toBe('pink');
  });

  it('takes a fresh selection', () => {
    const { commit, peek } = setup();

    commit(themeSelectedTopic('jade'));

    expect(peek(themeStore).id).toBe('jade');
  });

  it('rewinds to the default when the preference is forgotten', () => {
    const { commit, peek } = setup();
    commit(themeSelectedTopic('jade'));

    commit(themeResetTopic());

    expect(peek(themeStore).id).toBe(DEFAULT_THEME_ID);
  });
});

describe('colorSchemeStore', () => {
  it('starts unhydrated so SSG can render with no selection', () => {
    const { peek } = setup();

    expect(peek(colorSchemeStore).id).toBeNull();
  });

  it('takes the override the prelude stamped on <html>', () => {
    const { commit, peek } = setup();

    commit(colorSchemeRestoredTopic('dark'));

    expect(peek(colorSchemeStore).id).toBe('dark');
  });

  it('takes a fresh selection', () => {
    const { commit, peek } = setup();

    commit(colorSchemeSelectedTopic('light'));

    expect(peek(colorSchemeStore).id).toBe('light');
  });

  it("holds 'system' as a real selection rather than an absent one", () => {
    const { commit, peek } = setup();

    commit(colorSchemeSelectedTopic('system'));

    expect(peek(colorSchemeStore).id).toBe('system');
  });
});

describe('motionStore', () => {
  it('starts unhydrated so SSG can render with no selection', () => {
    const { peek } = setup();

    expect(peek(motionStore).id).toBeNull();
  });

  it('takes the override the prelude stamped on <html>', () => {
    const { commit, peek } = setup();

    commit(motionRestoredTopic('reduce'));

    expect(peek(motionStore).id).toBe('reduce');
  });

  it('takes a fresh selection', () => {
    const { commit, peek } = setup();

    commit(motionSelectedTopic('no-preference'));

    expect(peek(motionStore).id).toBe('no-preference');
  });

  it("holds 'system' as a real selection rather than an absent one", () => {
    const { commit, peek } = setup();

    commit(motionSelectedTopic('system'));

    expect(peek(motionStore).id).toBe('system');
  });
});
