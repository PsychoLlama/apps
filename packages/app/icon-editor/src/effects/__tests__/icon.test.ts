import { createTestController } from '@lib/effects/testing';
import { $editor, $iconPicked, $loading, $picker } from '../../state';
import { $randomizeIcon, $resolveIconParam } from '../icon';
import type { IconRef } from '../../icons';
import {
  PAGE_URLS,
  homeEntry,
  samplePack,
  serveAssets,
  starEntry,
} from './assets';

const homeIcon: IconRef = {
  pack: 'mdi',
  name: 'home',
  body: homeEntry.body,
  width: 24,
  height: 24,
};

describe('$resolveIconParam', () => {
  it('lands the catalog even when the URL names no icon', async () => {
    serveAssets();
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const resolveIconParam = await effects.run($resolveIconParam);

    await resolveIconParam(undefined);

    expect(picker.packs).toEqual([samplePack]);
  });

  it('pulls the manifest and owning chunk in, then lands the icon', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const resolveIconParam = await effects.run($resolveIconParam);

    await resolveIconParam('mdi:home');

    expect(editor.icon).toMatchObject(homeIcon);
    expect(load.pending).toBe(0);
    // Only the chunk holding `home`.
    expect(fetch.mock.calls.map(([url]) => url)).not.toContain(PAGE_URLS[1]);
  });

  it('accepts a bare name as an MDI icon', async () => {
    serveAssets();
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const resolveIconParam = await effects.run($resolveIconParam);

    await resolveIconParam('home');

    expect(editor.icon).toMatchObject(homeIcon);
  });

  it('leaves the icon alone when the pack or name no longer exists', async () => {
    serveAssets();
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const load = await effects.run($loading);
    const resolveIconParam = await effects.run($resolveIconParam);

    await resolveIconParam('gone:home');
    await resolveIconParam('mdi:gone');

    expect(editor.icon).toBeUndefined();
    expect(load.pending).toBe(0);
  });

  it('skips the lookup when the param matches the icon already held', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();
    const iconPicked = await effects.run($iconPicked);
    const load = await effects.run($loading);
    const resolveIconParam = await effects.run($resolveIconParam);

    iconPicked(homeIcon);
    const requestId = load.requestId;
    await resolveIconParam('mdi:home');

    expect(load.requestId).toBe(requestId);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('discards the result when a pick lands mid-resolve', async () => {
    serveAssets();
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const iconPicked = await effects.run($iconPicked);
    const resolveIconParam = await effects.run($resolveIconParam);
    const picked = { ...homeIcon, name: 'cog' };

    const pending = resolveIconParam('mdi:home');
    iconPicked(picked);
    await pending;

    expect(editor.icon).toEqual(picked);
  });
});

describe('$randomizeIcon', () => {
  it('rolls a chunk and then a name within the active pack', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();
    const editor = await effects.run($editor);
    const randomize = await effects.run($randomizeIcon);

    // Last chunk, then its only name.
    using random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await randomize();

    expect(random).toHaveBeenCalledTimes(2);
    expect(editor.icon).toMatchObject({ pack: 'mdi', name: starEntry.name });
    expect(fetch.mock.calls.map(([url]) => url)).not.toContain(PAGE_URLS[0]);
  });
});
