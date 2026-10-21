import { createTestController } from '@lib/effects/testing';
import {
  DEFAULT_ICON_EDITOR_STATE,
  $editor,
  $editorReset,
  $iconPicked,
  $iconResolveStarted,
  $iconResolved,
  $loading,
  $packChosen,
  $paddingChanged,
  $paletteChanged,
  $pickerClosed,
  $pickerOpened,
  $rail,
  $shapeChanged,
  $urlHydrated,
  shareParamsOf,
} from '../editor';
import { $iconEntries, $picker, DEFAULT_PACK_ID, entryKey } from '../picker';
import type { IconRef } from '../../icons';

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

const style = { palette: 'red', shape: 'circle', padding: 20 } as const;

describe('$iconPicked', () => {
  it('writes the icon and supersedes any in-flight resolve', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const iconResolveStarted = await effects.run($iconResolveStarted);
    const iconPicked = await effects.run($iconPicked);

    iconResolveStarted();
    iconPicked(sampleIcon);

    expect(editor.icon).toEqual(sampleIcon);
    // Zeroed, so the URL mirror sees a settled icon without waiting.
    expect(load).toEqual({ pending: 0, requestId: 2 });
  });

  it('pulls the picker to the icon’s pack, seeds its body, and closes the picker', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const entries = await effects.run($iconEntries);
    const rail = await effects.run($rail);
    const pickerOpened = await effects.run($pickerOpened);
    const iconPicked = await effects.run($iconPicked);

    pickerOpened('pack-detail');
    iconPicked(otherIcon);

    expect(picker.activePackId).toBe('tabler');
    expect(entries().get(entryKey('tabler', 'rocket'))?.body).toBe(
      otherIcon.body,
    );
    expect(rail()).toBe('properties');
  });
});

describe('$paletteChanged / $shapeChanged / $paddingChanged', () => {
  it('write the corresponding style fields', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const paletteChanged = await effects.run($paletteChanged);
    const shapeChanged = await effects.run($shapeChanged);
    const paddingChanged = await effects.run($paddingChanged);

    paletteChanged('red');
    shapeChanged('circle');
    paddingChanged(20);

    expect(editor).toMatchObject(style);
  });
});

describe('$editorReset', () => {
  it('restores the canonical defaults and supersedes any pending resolve', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const iconPicked = await effects.run($iconPicked);
    const paletteChanged = await effects.run($paletteChanged);
    const iconResolveStarted = await effects.run($iconResolveStarted);
    const editorReset = await effects.run($editorReset);

    iconPicked(sampleIcon);
    paletteChanged('red');
    iconResolveStarted();
    editorReset();

    expect(editor).toEqual(DEFAULT_ICON_EDITOR_STATE);
    expect(load).toEqual({ pending: 0, requestId: 3 });
  });

  it('returns the picker to the default pack so the panel’s pack card matches the blank slate', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const iconPicked = await effects.run($iconPicked);
    const editorReset = await effects.run($editorReset);

    iconPicked(otherIcon);
    editorReset();

    expect(picker.activePackId).toBe(DEFAULT_PACK_ID);
  });
});

describe('$urlHydrated', () => {
  it('applies style fields without touching the icon while the param is present', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const iconPicked = await effects.run($iconPicked);
    const urlHydrated = await effects.run($urlHydrated);

    iconPicked(sampleIcon);
    urlHydrated(style, 'mdi:home');

    expect(editor).toEqual({ ...style, icon: sampleIcon });
  });

  it('clears the icon when the param is genuinely gone', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const iconPicked = await effects.run($iconPicked);
    const urlHydrated = await effects.run($urlHydrated);

    iconPicked(sampleIcon);
    urlHydrated(style, undefined);

    expect(editor.icon).toBeUndefined();
  });

  it('leaves the icon alone when the absent param is a mirror echo of a pending resolve', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const iconPicked = await effects.run($iconPicked);
    const iconResolveStarted = await effects.run($iconResolveStarted);
    const urlHydrated = await effects.run($urlHydrated);

    iconPicked(sampleIcon);
    iconResolveStarted();
    urlHydrated(style, undefined);

    expect(editor.icon).toEqual(sampleIcon);
  });

  it('leaves the icon alone when the param is unparseable', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const iconPicked = await effects.run($iconPicked);
    const urlHydrated = await effects.run($urlHydrated);

    iconPicked(sampleIcon);
    urlHydrated(style, ':broken');

    expect(editor.icon).toEqual(sampleIcon);
  });
});

describe('$pickerOpened / $pickerClosed', () => {
  it('swaps the rail to the icon browser on a given view, and back', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const rail = await effects.run($rail);
    const pickerOpened = await effects.run($pickerOpened);
    const pickerClosed = await effects.run($pickerClosed);

    pickerOpened('packs');
    expect(rail()).toBe('picker');
    expect(picker.view).toBe('packs');

    pickerClosed();
    expect(rail()).toBe('properties');
  });
});

describe('$packChosen', () => {
  it('swaps the pack, closes the picker, and strands the old icon', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const picker = await effects.run($picker);
    const rail = await effects.run($rail);
    const iconPicked = await effects.run($iconPicked);
    const pickerOpened = await effects.run($pickerOpened);
    const packChosen = await effects.run($packChosen);

    iconPicked(sampleIcon);
    pickerOpened('packs');
    packChosen('tabler');

    expect(editor.icon).toBeUndefined();
    expect(picker.activePackId).toBe('tabler');
    expect(rail()).toBe('properties');
  });

  it('keeps the icon when the chosen pack is the one it already belongs to', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const iconPicked = await effects.run($iconPicked);
    const packChosen = await effects.run($packChosen);

    iconPicked(sampleIcon);
    packChosen('mdi');

    expect(editor.icon).toEqual(sampleIcon);
  });
});

describe('$iconResolveStarted / $iconResolved', () => {
  it('counts the resolve in flight, then lands its icon in the editor and the picker', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const picker = await effects.run($picker);
    const iconResolveStarted = await effects.run($iconResolveStarted);
    const iconResolved = await effects.run($iconResolved);

    iconResolveStarted();
    expect(load).toEqual({ pending: 1, requestId: 1 });

    iconResolved(load.requestId, otherIcon);
    expect(load.pending).toBe(0);
    expect(editor.icon).toEqual(otherIcon);
    expect(picker.activePackId).toBe('tabler');
  });

  it('treats a missing icon as a no-op write but still unwinds pending', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const iconPicked = await effects.run($iconPicked);
    const iconResolveStarted = await effects.run($iconResolveStarted);
    const iconResolved = await effects.run($iconResolved);

    iconPicked(sampleIcon);
    iconResolveStarted();
    iconResolved(load.requestId, undefined);

    expect(load.pending).toBe(0);
    expect(editor.icon).toEqual(sampleIcon);
  });

  it('discards a resolve something newer superseded, without going negative', async () => {
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const iconResolveStarted = await effects.run($iconResolveStarted);
    const iconPicked = await effects.run($iconPicked);
    const iconResolved = await effects.run($iconResolved);

    iconResolveStarted();
    const stale = load.requestId;
    iconPicked(sampleIcon);
    iconResolved(stale, otherIcon);

    expect(load.pending).toBe(0);
    expect(editor.icon).toEqual(sampleIcon);
  });
});

describe('shareParamsOf', () => {
  const settled = { pending: 0, requestId: 0 };

  it('drops every key sitting at its default so a resting link stays clean', () => {
    expect(shareParamsOf(DEFAULT_ICON_EDITOR_STATE, settled)).toEqual({
      icon: null,
      palette: null,
      shape: null,
      pad: null,
    });
  });

  it('encodes the icon and the non-default style fields', () => {
    expect(shareParamsOf({ ...style, icon: sampleIcon }, settled)).toEqual({
      icon: 'mdi:home',
      palette: 'red',
      shape: 'circle',
      pad: '20',
    });
  });

  it('omits the icon key entirely while a resolve is pending, so the URL keeps the param it already had', () => {
    const params = shareParamsOf(
      { ...style, icon: sampleIcon },
      { pending: 1, requestId: 1 },
    );

    expect(params).not.toHaveProperty('icon');
  });
});
