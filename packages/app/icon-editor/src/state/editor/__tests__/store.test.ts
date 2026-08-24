import { createTestRuntime } from '@lib/state';
import {
  DEFAULT_PACK_ID,
  entryKey,
  iconEntriesCell,
  pickerScope,
  pickerStore,
} from '../../picker/store';
import {
  DEFAULT_ICON_EDITOR_STATE,
  editorResetTopic,
  iconEditorScope,
  iconEditorStore,
  iconPickedTopic,
  iconResolveFailedTopic,
  iconResolveStartedTopic,
  iconResolveSupersededTopic,
  iconResolvedTopic,
  loadingStore,
  paddingChangedTopic,
  paletteChangedTopic,
  pickerClosedTopic,
  pickerOpenedTopic,
  railStore,
  shapeChangedTopic,
  shareParamsFormula,
  styleHydratedTopic,
} from '../store';
import type { IconRef } from '../../../icons';

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

describe('iconPickedTopic', () => {
  it('writes the icon and bumps the request id so any in-flight resolve is superseded', () => {
    const { commit, peek } = setup();

    commit(iconPickedTopic(sampleIcon));

    expect(peek(iconEditorStore).icon).toEqual(sampleIcon);
    expect(peek(loadingStore).requestId).toBe(1);
  });

  it('zeroes pending so the URL mirror sees a settled icon without waiting for stale fetches to land', () => {
    const { commit, peek } = setup();
    commit(iconResolveStartedTopic());
    commit(iconResolveStartedTopic());
    expect(peek(loadingStore).pending).toBe(2);

    commit(iconPickedTopic(sampleIcon));

    expect(peek(loadingStore).pending).toBe(0);
  });

  it('pulls the picker to the icon’s pack and seeds its body in the same transition', () => {
    const { commit, peek } = setup();

    commit(iconPickedTopic(otherIcon));

    expect(peek(pickerStore).activePackId).toBe('tabler');
    expect(peek(iconEntriesCell).get(entryKey('tabler', 'rocket'))?.body).toBe(
      otherIcon.body,
    );
  });
});

describe('editorResetTopic', () => {
  it('restores the canonical defaults', () => {
    const { commit, peek } = setup();
    commit(iconPickedTopic(sampleIcon));
    commit(paletteChangedTopic('mint'));
    commit(shapeChangedTopic('circle'));
    commit(paddingChangedTopic(30));

    commit(editorResetTopic());

    expect(peek(iconEditorStore)).toEqual(DEFAULT_ICON_EDITOR_STATE);
  });

  it('supersedes any pending resolve — zeroes pending, bumps requestId', () => {
    const { commit, peek } = setup();
    commit(iconResolveStartedTopic());

    commit(editorResetTopic());

    expect(peek(loadingStore).pending).toBe(0);
    expect(peek(loadingStore).requestId).toBe(2);
  });

  it('returns the picker to the default pack so the panel’s pack card matches the blank slate', () => {
    const { commit, peek } = setup();
    commit(iconPickedTopic(otherIcon));

    commit(editorResetTopic());

    expect(peek(pickerStore).activePackId).toBe(DEFAULT_PACK_ID);
  });
});

describe('styleHydratedTopic', () => {
  it('applies style fields without touching the icon', () => {
    const { commit, peek } = setup();
    commit(iconPickedTopic(sampleIcon));

    commit(
      styleHydratedTopic({ palette: 'mint', shape: 'circle', padding: 8 }),
    );

    expect(peek(iconEditorStore).palette).toBe('mint');
    expect(peek(iconEditorStore).shape).toBe('circle');
    expect(peek(iconEditorStore).padding).toBe(8);
    expect(peek(iconEditorStore).icon).toEqual(sampleIcon);
  });
});

describe('iconResolveStartedTopic', () => {
  it('increments pending and bumps the request id atomically', () => {
    const { commit, peek } = setup();

    commit(iconResolveStartedTopic());
    commit(iconResolveStartedTopic());

    expect(peek(loadingStore).pending).toBe(2);
    expect(peek(loadingStore).requestId).toBe(2);
  });
});

describe('iconResolvedTopic', () => {
  it('commits the icon and decrements pending', () => {
    const { commit, peek } = setup();
    commit(iconResolveStartedTopic());

    commit(iconResolvedTopic(sampleIcon));

    expect(peek(iconEditorStore).icon).toEqual(sampleIcon);
    expect(peek(loadingStore).pending).toBe(0);
  });

  it('treats a missing icon as a no-op write but still decrements pending', () => {
    const { commit, peek } = setup();
    commit(iconPickedTopic(sampleIcon));
    commit(iconResolveStartedTopic());

    commit(iconResolvedTopic(undefined));

    expect(peek(iconEditorStore).icon).toEqual(sampleIcon);
    expect(peek(loadingStore).pending).toBe(0);
  });
});

describe('iconResolveSupersededTopic / iconResolveFailedTopic', () => {
  it('unwind the loading counter without going negative or touching the icon', () => {
    const { commit, peek } = setup();
    commit(iconPickedTopic(sampleIcon));
    commit(iconResolveStartedTopic());

    commit(iconResolveSupersededTopic());
    commit(iconResolveFailedTopic());

    expect(peek(loadingStore).pending).toBe(0);
    expect(peek(iconEditorStore).icon).toEqual(sampleIcon);
  });
});

describe('pickerOpenedTopic / pickerClosedTopic', () => {
  it('swaps the rail to the icon browser and back to the properties inspector', () => {
    const { commit, peek } = setup();

    commit(pickerOpenedTopic());
    expect(peek(railStore).view).toBe('picker');

    commit(pickerClosedTopic());
    expect(peek(railStore).view).toBe('properties');
  });
});

describe('shareParamsFormula', () => {
  it('drops every key sitting at its default so a resting link stays clean', () => {
    const { peek } = setup();

    expect(peek(shareParamsFormula)).toEqual({
      icon: null,
      palette: null,
      shape: null,
      pad: null,
    });
  });

  it('encodes the icon and the non-default style fields', () => {
    const { commit, peek } = setup();
    commit(
      iconPickedTopic(sampleIcon),
      paletteChangedTopic('mint'),
      paddingChangedTopic(25),
    );

    expect(peek(shareParamsFormula)).toEqual({
      icon: 'mdi:home',
      palette: 'mint',
      shape: null,
      pad: '25',
    });
  });

  it('omits the icon key entirely while a resolve is pending, so the URL keeps the param it already had', () => {
    const { commit, peek } = setup();
    commit(iconResolveStartedTopic());

    expect(peek(shareParamsFormula)).not.toHaveProperty('icon');
  });
});
