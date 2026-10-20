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
    });
  });

  it('takes the theme the prelude stamped on <html>', () => {
    const { commit, peek } = setup();

    commit(appearanceRestoredTopic({ theme: 'pink' }));

    expect(peek(appearanceStore)).toEqual({ theme: 'pink' });
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
});
