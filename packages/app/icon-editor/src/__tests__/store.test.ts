import { createTestRuntime } from '@lib/state-next';
import {
  DEFAULT_PACK_ID,
  entryKey,
  iconEntries,
  picker,
  pickerScope,
} from '../components/icon-grid/store';
import {
  DEFAULT_ICON_EDITOR_STATE,
  editorReset,
  iconEditor,
  iconEditorScope,
  iconPicked,
  iconResolveFailed,
  iconResolveStarted,
  iconResolveSuperseded,
  iconResolved,
  loading,
  paddingChanged,
  paletteChanged,
  pickerClosed,
  pickerOpened,
  rail,
  shapeChanged,
  shareParams,
  styleHydrated,
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
  const runtime = createTestRuntime();
  runtime.anchor(iconEditorScope);
  runtime.anchor(pickerScope);
  return runtime;
};

describe('iconPicked', () => {
  it('writes the icon and bumps the request id so any in-flight resolve is superseded', () => {
    const { commit, peek } = setup();

    commit(iconPicked(sampleIcon));

    expect(peek(iconEditor).icon).toEqual(sampleIcon);
    expect(peek(loading).requestId).toBe(1);
  });

  it('zeroes pending so the URL mirror sees a settled icon without waiting for stale fetches to land', () => {
    const { commit, peek } = setup();
    commit(iconResolveStarted());
    commit(iconResolveStarted());
    expect(peek(loading).pending).toBe(2);

    commit(iconPicked(sampleIcon));

    expect(peek(loading).pending).toBe(0);
  });

  it('pulls the picker to the icon’s pack and seeds its body in the same transition', () => {
    const { commit, peek } = setup();

    commit(iconPicked(otherIcon));

    expect(peek(picker).activePackId).toBe('tabler');
    expect(peek(iconEntries).get(entryKey('tabler', 'rocket'))?.body).toBe(
      otherIcon.body,
    );
  });
});

describe('editorReset', () => {
  it('restores the canonical defaults', () => {
    const { commit, peek } = setup();
    commit(iconPicked(sampleIcon));
    commit(paletteChanged('mint'));
    commit(shapeChanged('circle'));
    commit(paddingChanged(30));

    commit(editorReset());

    expect(peek(iconEditor)).toEqual(DEFAULT_ICON_EDITOR_STATE);
  });

  it('supersedes any pending resolve — zeroes pending, bumps requestId', () => {
    const { commit, peek } = setup();
    commit(iconResolveStarted());

    commit(editorReset());

    expect(peek(loading).pending).toBe(0);
    expect(peek(loading).requestId).toBe(2);
  });

  it('returns the picker to the default pack so the panel’s pack card matches the blank slate', () => {
    const { commit, peek } = setup();
    commit(iconPicked(otherIcon));

    commit(editorReset());

    expect(peek(picker).activePackId).toBe(DEFAULT_PACK_ID);
  });
});

describe('styleHydrated', () => {
  it('applies style fields without touching the icon', () => {
    const { commit, peek } = setup();
    commit(iconPicked(sampleIcon));

    commit(styleHydrated({ palette: 'mint', shape: 'circle', padding: 8 }));

    expect(peek(iconEditor).palette).toBe('mint');
    expect(peek(iconEditor).shape).toBe('circle');
    expect(peek(iconEditor).padding).toBe(8);
    expect(peek(iconEditor).icon).toEqual(sampleIcon);
  });
});

describe('iconResolveStarted', () => {
  it('increments pending and bumps the request id atomically', () => {
    const { commit, peek } = setup();

    commit(iconResolveStarted());
    commit(iconResolveStarted());

    expect(peek(loading).pending).toBe(2);
    expect(peek(loading).requestId).toBe(2);
  });
});

describe('iconResolved', () => {
  it('commits the icon and decrements pending', () => {
    const { commit, peek } = setup();
    commit(iconResolveStarted());

    commit(iconResolved(sampleIcon));

    expect(peek(iconEditor).icon).toEqual(sampleIcon);
    expect(peek(loading).pending).toBe(0);
  });

  it('treats a missing icon as a no-op write but still decrements pending', () => {
    const { commit, peek } = setup();
    commit(iconPicked(sampleIcon));
    commit(iconResolveStarted());

    commit(iconResolved(undefined));

    expect(peek(iconEditor).icon).toEqual(sampleIcon);
    expect(peek(loading).pending).toBe(0);
  });
});

describe('iconResolveSuperseded / iconResolveFailed', () => {
  it('unwind the loading counter without going negative or touching the icon', () => {
    const { commit, peek } = setup();
    commit(iconPicked(sampleIcon));
    commit(iconResolveStarted());

    commit(iconResolveSuperseded());
    commit(iconResolveFailed());

    expect(peek(loading).pending).toBe(0);
    expect(peek(iconEditor).icon).toEqual(sampleIcon);
  });
});

describe('pickerOpened / pickerClosed', () => {
  it('swaps the rail to the icon browser and back to the properties inspector', () => {
    const { commit, peek } = setup();

    commit(pickerOpened());
    expect(peek(rail).view).toBe('picker');

    commit(pickerClosed());
    expect(peek(rail).view).toBe('properties');
  });
});

describe('shareParams', () => {
  it('drops every key sitting at its default so a resting link stays clean', () => {
    const { peek } = setup();

    expect(peek(shareParams)).toEqual({
      icon: null,
      palette: null,
      shape: null,
      pad: null,
    });
  });

  it('encodes the icon and the non-default style fields', () => {
    const { commit, peek } = setup();
    commit(iconPicked(sampleIcon), paletteChanged('mint'), paddingChanged(25));

    expect(peek(shareParams)).toEqual({
      icon: 'mdi:home',
      palette: 'mint',
      shape: null,
      pad: '25',
    });
  });

  it('omits the icon key entirely while a resolve is pending, so the URL keeps the param it already had', () => {
    const { commit, peek } = setup();
    commit(iconResolveStarted());

    expect(peek(shareParams)).not.toHaveProperty('icon');
  });
});
