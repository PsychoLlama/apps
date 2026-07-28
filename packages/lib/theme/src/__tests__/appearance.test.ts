/**
 * Fold tests for the appearance preferences: commit a fact, assert the
 * state it lands. No sagas and no capabilities are involved — what
 * publishes each fact is covered by the saga tests, and the DOM /
 * localStorage writes by the capability tests.
 */

import { createTestRuntime } from '@lib/state';
import {
  appearanceRestoredTopic,
  appearanceStore,
  colorSchemeSelectedTopic,
  motionSelectedTopic,
  themeResetTopic,
  themeSelectedTopic,
} from '../appearance';
import { DEFAULT_THEME_ID } from '../constants';
import { appearanceScope } from '../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(appearanceScope);
  return runtime;
};

describe('appearanceStore', () => {
  it('starts unhydrated so SSG can render with no selection', () => {
    const { peek } = setup();

    expect(peek(appearanceStore)).toEqual({
      theme: null,
      colorScheme: null,
      motion: null,
    });
  });

  it('takes every preference the prelude stamped on <html> at once', () => {
    const { commit, peek } = setup();

    commit(
      appearanceRestoredTopic({
        theme: 'pink',
        colorScheme: 'dark',
        motion: 'reduce',
      }),
    );

    expect(peek(appearanceStore)).toEqual({
      theme: 'pink',
      colorScheme: 'dark',
      motion: 'reduce',
    });
  });

  it('takes a fresh theme selection', () => {
    const { commit, peek } = setup();

    commit(themeSelectedTopic('jade'));

    expect(peek(appearanceStore).theme).toBe('jade');
  });

  it('rewinds the theme to the default when the preference is forgotten', () => {
    const { commit, peek } = setup();
    commit(themeSelectedTopic('jade'));

    commit(themeResetTopic());

    expect(peek(appearanceStore).theme).toBe(DEFAULT_THEME_ID);
  });

  it('takes a fresh color-scheme selection', () => {
    const { commit, peek } = setup();

    commit(colorSchemeSelectedTopic('light'));

    expect(peek(appearanceStore).colorScheme).toBe('light');
  });

  it('takes a fresh motion selection', () => {
    const { commit, peek } = setup();

    commit(motionSelectedTopic('no-preference'));

    expect(peek(appearanceStore).motion).toBe('no-preference');
  });

  it("holds 'system' as a real selection rather than an absent one", () => {
    const { commit, peek } = setup();

    commit(colorSchemeSelectedTopic('system'), motionSelectedTopic('system'));

    expect(peek(appearanceStore).colorScheme).toBe('system');
    expect(peek(appearanceStore).motion).toBe('system');
  });

  it('leaves the other preferences alone when one changes', () => {
    const { commit, peek } = setup();
    commit(
      appearanceRestoredTopic({
        theme: 'teal',
        colorScheme: 'dark',
        motion: 'reduce',
      }),
    );

    commit(themeSelectedTopic('plum'));

    expect(peek(appearanceStore)).toEqual({
      theme: 'plum',
      colorScheme: 'dark',
      motion: 'reduce',
    });
  });
});
