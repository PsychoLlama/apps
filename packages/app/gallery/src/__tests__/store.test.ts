/**
 * Fold tests for the gallery's tab selection: commit a fact, assert the
 * state it lands. No components in play — `SectionTabs` only reads this
 * store and commits to it.
 */

import { createTestRuntime } from '@lib/state';
import {
  FIRST_SECTION,
  galleryScope,
  galleryStore,
  sectionSelectedTopic,
} from '../store';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(galleryScope);
  return runtime;
};

describe('galleryStore', () => {
  it('starts empty so every listing falls back to its first section', () => {
    const { peek } = setup();

    expect(peek(galleryStore).activeSections).toEqual({});
    expect(peek(galleryStore).activeSections.Button ?? FIRST_SECTION).toBe(
      FIRST_SECTION,
    );
  });

  it('takes a selected section for a listing', () => {
    const { commit, peek } = setup();

    commit(sectionSelectedTopic({ listing: 'Button', section: '2' }));

    expect(peek(galleryStore).activeSections.Button).toBe('2');
  });

  it("replaces a listing's previous selection", () => {
    const { commit, peek } = setup();

    commit(sectionSelectedTopic({ listing: 'Button', section: '2' }));
    commit(sectionSelectedTopic({ listing: 'Button', section: '1' }));

    expect(peek(galleryStore).activeSections.Button).toBe('1');
  });

  it('tracks each listing separately', () => {
    const { commit, peek } = setup();

    commit(
      sectionSelectedTopic({ listing: 'Button', section: '2' }),
      sectionSelectedTopic({ listing: 'Callout', section: '1' }),
    );

    expect(peek(galleryStore).activeSections).toEqual({
      Button: '2',
      Callout: '1',
    });
  });
});
