import { createTestController } from '@lib/effects/testing';
import { $gallery, $sectionSelected, FIRST_SECTION } from '../sections';

describe('$gallery', () => {
  it('starts empty so every listing falls back to its first section', async () => {
    await using effects = createTestController();
    const gallery = await effects.run($gallery);

    expect(gallery.activeSections).toEqual({});
    expect(gallery.activeSections.Button ?? FIRST_SECTION).toBe(FIRST_SECTION);
  });
});

describe('$sectionSelected', () => {
  it('takes a selected section for a listing', async () => {
    await using effects = createTestController();
    const gallery = await effects.run($gallery);
    const sectionSelected = await effects.run($sectionSelected);

    sectionSelected('Button', '2');

    expect(gallery.activeSections.Button).toBe('2');
  });

  it("replaces a listing's previous selection", async () => {
    await using effects = createTestController();
    const gallery = await effects.run($gallery);
    const sectionSelected = await effects.run($sectionSelected);

    sectionSelected('Button', '2');
    sectionSelected('Button', '1');

    expect(gallery.activeSections.Button).toBe('1');
  });

  it('tracks each listing separately', async () => {
    await using effects = createTestController();
    const gallery = await effects.run($gallery);
    const sectionSelected = await effects.run($sectionSelected);

    sectionSelected('Button', '2');
    sectionSelected('Callout', '1');

    expect(gallery.activeSections).toEqual({ Button: '2', Callout: '1' });
  });
});
