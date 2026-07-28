/**
 * Saga tests for the appearance preferences. Most run under `simulate`,
 * so there's no runtime and no state — the DOM is stubbed and the
 * assertions are about what each saga published and wrote through.
 *
 * The exceptions are the ordering cases, which need real folds to prove
 * the store is already updated by the time the capability runs. Those use
 * a test runtime with `themeScope` anchored.
 */

import { createTestRuntime, simulate } from '@lib/state-next';
import {
  applyColorScheme,
  applyMotion,
  applyTheme,
  readActiveColorScheme,
  readActiveMotion,
  readActiveTheme,
  resetTheme,
} from '../capabilities';
import { DEFAULT_THEME_ID } from '../constants';
import {
  hydrateColorSchemeSaga,
  hydrateMotionSaga,
  hydrateThemeSaga,
  resetThemeSaga,
  selectColorSchemeSaga,
  selectMotionSaga,
  selectThemeSaga,
} from '../sagas';
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

describe('hydrateThemeSaga', () => {
  it('publishes the theme it read off the DOM', async () => {
    const trace = await simulate(hydrateThemeSaga(), {
      calls: [[readActiveTheme, () => 'pink']],
    });

    expect(trace.commits).toEqual([[themeRestoredTopic('pink')]]);
  });
});

describe('selectThemeSaga', () => {
  it('publishes the selection and writes it through', async () => {
    const apply = vi.fn();

    const trace = await simulate(selectThemeSaga('teal'), {
      calls: [[applyTheme, apply]],
    });

    expect(trace.commits).toEqual([[themeSelectedTopic('teal')]]);
    expect(apply).toHaveBeenCalledWith(expect.anything(), 'teal');
  });

  it('updates state before the side effect runs', async () => {
    const observed: Array<string | null> = [];
    const runtime = createTestRuntime({
      calls: [[applyTheme, () => observed.push(runtime.peek(themeStore).id)]],
    });
    runtime.anchor(themeScope);

    await runtime.run(selectThemeSaga('purple'));

    // The commit lands first, so the capability sees the post-commit
    // state — confirming the UI gets the value before the DOM and
    // localStorage writes.
    expect(observed).toEqual(['purple']);
    expect(runtime.peek(themeStore).id).toBe('purple');
  });
});

describe('resetThemeSaga', () => {
  it('publishes the reset and drops the persisted preference', async () => {
    const forget = vi.fn();

    const trace = await simulate(resetThemeSaga(), {
      calls: [[resetTheme, forget]],
    });

    expect(trace.commits).toEqual([[themeResetTopic()]]);
    expect(forget).toHaveBeenCalledTimes(1);
  });

  it('rewinds state to the default before the side effect runs', async () => {
    const observed: Array<string | null> = [];
    const runtime = createTestRuntime({
      calls: [[resetTheme, () => observed.push(runtime.peek(themeStore).id)]],
    });
    runtime.anchor(themeScope);
    runtime.commit(themeSelectedTopic('jade'));

    await runtime.run(resetThemeSaga());

    expect(observed).toEqual([DEFAULT_THEME_ID]);
    expect(runtime.peek(themeStore).id).toBe(DEFAULT_THEME_ID);
  });
});

describe('hydrateColorSchemeSaga', () => {
  it('publishes the override it read off the DOM', async () => {
    const trace = await simulate(hydrateColorSchemeSaga(), {
      calls: [[readActiveColorScheme, () => 'dark']],
    });

    expect(trace.commits).toEqual([[colorSchemeRestoredTopic('dark')]]);
  });
});

describe('selectColorSchemeSaga', () => {
  it('publishes the selection and writes it through', async () => {
    const apply = vi.fn();

    const trace = await simulate(selectColorSchemeSaga('light'), {
      calls: [[applyColorScheme, apply]],
    });

    expect(trace.commits).toEqual([[colorSchemeSelectedTopic('light')]]);
    expect(apply).toHaveBeenCalledWith(expect.anything(), 'light');
  });

  it("carries 'system' through as a regular selection", async () => {
    const apply = vi.fn();

    const trace = await simulate(selectColorSchemeSaga('system'), {
      calls: [[applyColorScheme, apply]],
    });

    expect(trace.commits).toEqual([[colorSchemeSelectedTopic('system')]]);
    expect(apply).toHaveBeenCalledWith(expect.anything(), 'system');
  });

  it('updates state before the side effect runs', async () => {
    const observed: Array<string | null> = [];
    const runtime = createTestRuntime({
      calls: [
        [
          applyColorScheme,
          () => observed.push(runtime.peek(colorSchemeStore).id),
        ],
      ],
    });
    runtime.anchor(themeScope);

    await runtime.run(selectColorSchemeSaga('dark'));

    expect(observed).toEqual(['dark']);
    expect(runtime.peek(colorSchemeStore).id).toBe('dark');
  });
});

describe('hydrateMotionSaga', () => {
  it('publishes the override it read off the DOM', async () => {
    const trace = await simulate(hydrateMotionSaga(), {
      calls: [[readActiveMotion, () => 'reduce']],
    });

    expect(trace.commits).toEqual([[motionRestoredTopic('reduce')]]);
  });
});

describe('selectMotionSaga', () => {
  it('publishes the selection and writes it through', async () => {
    const apply = vi.fn();

    const trace = await simulate(selectMotionSaga('no-preference'), {
      calls: [[applyMotion, apply]],
    });

    expect(trace.commits).toEqual([[motionSelectedTopic('no-preference')]]);
    expect(apply).toHaveBeenCalledWith(expect.anything(), 'no-preference');
  });

  it("carries 'system' through as a regular selection", async () => {
    const apply = vi.fn();

    const trace = await simulate(selectMotionSaga('system'), {
      calls: [[applyMotion, apply]],
    });

    expect(trace.commits).toEqual([[motionSelectedTopic('system')]]);
    expect(apply).toHaveBeenCalledWith(expect.anything(), 'system');
  });

  it('updates state before the side effect runs', async () => {
    const observed: Array<string | null> = [];
    const runtime = createTestRuntime({
      calls: [[applyMotion, () => observed.push(runtime.peek(motionStore).id)]],
    });
    runtime.anchor(themeScope);

    await runtime.run(selectMotionSaga('reduce'));

    expect(observed).toEqual(['reduce']);
    expect(runtime.peek(motionStore).id).toBe('reduce');
  });
});
