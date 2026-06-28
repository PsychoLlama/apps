import { createTestBindings } from '@lib/state';
import {
  applyRandomStyle,
  applyResolvedIcon,
  beginIconResolve,
  closePicker,
  failIconResolve,
  hydrateStyle,
  openPicker,
  reset,
  setIcon,
  setPadding,
  setPalette,
  setShape,
} from '../bindings';
import {
  DEFAULT_ICON_EDITOR_STATE,
  iconEditorStore,
  loadingStore,
  railStore,
} from '../store';
import type { IconRef } from '../icons';

const sampleIcon: IconRef = {
  pack: 'mdi',
  name: 'home',
  body: '<path d="M0 0"/>',
  width: 24,
  height: 24,
};

const otherIcon: IconRef = {
  pack: 'tabler',
  name: 'rocket',
  body: '<path d="M1 1"/>',
  width: 24,
  height: 24,
};

const setup = () => {
  const bindings = createTestBindings();
  return {
    ...bindings,
    icon: bindings.createStore(iconEditorStore),
    loading: bindings.createStore(loadingStore),
    rail: bindings.createStore(railStore),
  };
};

describe('setIcon', () => {
  it('writes the icon and bumps the request id so any in-flight resolve is superseded', () => {
    const { icon, loading, useAction } = setup();

    useAction(setIcon)(sampleIcon);

    expect(icon.icon).toEqual(sampleIcon);
    expect(loading.requestId).toBe(1);
  });

  it('zeroes pending so the URL mirror sees a settled icon without waiting for stale fetches to land', () => {
    const { loading, useAction } = setup();
    useAction(beginIconResolve)();
    useAction(beginIconResolve)();
    expect(loading.pending).toBe(2);

    useAction(setIcon)(sampleIcon);

    expect(loading.pending).toBe(0);
  });
});

describe('reset', () => {
  it('restores the canonical defaults', () => {
    const { icon, useAction } = setup();
    useAction(setIcon)(sampleIcon);
    useAction(setPalette)('mint');
    useAction(setShape)('circle');
    useAction(setPadding)(30);

    useAction(reset)();

    expect(icon.icon).toBe(DEFAULT_ICON_EDITOR_STATE.icon);
    expect(icon.palette).toBe(DEFAULT_ICON_EDITOR_STATE.palette);
    expect(icon.shape).toBe(DEFAULT_ICON_EDITOR_STATE.shape);
    expect(icon.padding).toBe(DEFAULT_ICON_EDITOR_STATE.padding);
  });

  it('supersedes any pending resolve — zeroes pending, bumps requestId', () => {
    const { loading, useAction } = setup();
    useAction(beginIconResolve)();

    useAction(reset)();

    expect(loading.pending).toBe(0);
    expect(loading.requestId).toBe(2);
  });
});

describe('hydrateStyle', () => {
  it('applies validated style fields without touching the icon', () => {
    const { icon, useAction } = setup();
    useAction(setIcon)(sampleIcon);

    useAction(hydrateStyle)({ palette: 'mint', shape: 'circle', padding: 8 });

    expect(icon.palette).toBe('mint');
    expect(icon.shape).toBe('circle');
    expect(icon.padding).toBe(8);
    expect(icon.icon).toEqual(sampleIcon);
  });

  it('falls back to the canonical defaults for missing or invalid fields', () => {
    const { icon, useAction } = setup();
    useAction(setPalette)('mint');
    useAction(setShape)('circle');
    useAction(setPadding)(30);

    useAction(hydrateStyle)({});

    expect(icon.palette).toBe(DEFAULT_ICON_EDITOR_STATE.palette);
    expect(icon.shape).toBe(DEFAULT_ICON_EDITOR_STATE.shape);
    expect(icon.padding).toBe(DEFAULT_ICON_EDITOR_STATE.padding);
  });
});

describe('beginIconResolve', () => {
  it('increments pending and bumps the request id atomically', () => {
    const { loading, useAction } = setup();

    useAction(beginIconResolve)();
    useAction(beginIconResolve)();

    expect(loading.pending).toBe(2);
    expect(loading.requestId).toBe(2);
  });
});

describe('applyResolvedIcon', () => {
  it('commits the icon and decrements pending when the request id is still current', () => {
    const { icon, loading, useAction } = setup();
    useAction(beginIconResolve)();
    const requestId = loading.requestId;

    useAction(applyResolvedIcon)({ icon: sampleIcon, requestId });

    expect(icon.icon).toEqual(sampleIcon);
    expect(loading.pending).toBe(0);
  });

  it('drops the icon write when the live request id has moved on, but still unwinds the loading counter', () => {
    const { icon, loading, useAction } = setup();
    useAction(beginIconResolve)();
    const stale = loading.requestId;
    // Simulate a user pick landing while the original resolve is in
    // flight — bumps requestId and zeroes pending. The stale fetch
    // must not overwrite the pick when it eventually returns.
    useAction(setIcon)(otherIcon);
    expect(loading.pending).toBe(0);

    useAction(applyResolvedIcon)({ icon: sampleIcon, requestId: stale });

    expect(icon.icon).toEqual(otherIcon);
    expect(loading.pending).toBe(0);
  });

  it('treats an undefined resolved icon as a no-op write but still decrements pending', () => {
    const { icon, loading, useAction } = setup();
    useAction(setIcon)(sampleIcon);
    useAction(beginIconResolve)();
    const requestId = loading.requestId;

    useAction(applyResolvedIcon)({ icon: undefined, requestId });

    expect(icon.icon).toEqual(sampleIcon);
    expect(loading.pending).toBe(0);
  });
});

describe('failIconResolve', () => {
  it('decrements pending without going negative', () => {
    const { loading, useAction } = setup();
    useAction(beginIconResolve)();

    useAction(failIconResolve)();
    useAction(failIconResolve)();

    expect(loading.pending).toBe(0);
  });
});

describe('applyRandomStyle', () => {
  it('writes every style field from the seed in one flush', () => {
    const { icon, useAction } = setup();

    useAction(applyRandomStyle)({
      palette: 'mint',
      shape: 'circle',
      padding: 30,
    });

    expect(icon.palette).toBe('mint');
    expect(icon.shape).toBe('circle');
    expect(icon.padding).toBe(30);
  });
});

describe('openPicker / closePicker', () => {
  it('swaps the rail to the icon browser and back to the properties inspector', () => {
    const { rail, useAction } = setup();

    useAction(openPicker)();
    expect(rail.view).toBe('picker');

    useAction(closePicker)();
    expect(rail.view).toBe('properties');
  });
});
