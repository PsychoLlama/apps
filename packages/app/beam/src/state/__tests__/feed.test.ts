/** Unit tests for the feed of the group on screen. */

import type { Item } from '@crate/beam';
import { createTestController } from '@lib/effects/testing';
import {
  $feed,
  $feedChanged,
  $groupViewed,
  ITEM_MAX_LENGTH,
  linkOf,
  normalizeBody,
} from '../feed';

const GROUP = 'aaaa';
const OTHER = 'bbbb';

const item = (id: string, body: string): Item => ({
  id,
  body,
  author: 'author',
  createdAt: 0,
  committed: true,
});

describe('$feed', () => {
  it('starts out looking at nothing', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);

    expect(feed).toEqual({ groupId: null, loaded: false, items: [] });
  });
});

describe('$groupViewed', () => {
  it('turns to a group, unanswered', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);

    groupViewed(GROUP);

    expect(feed).toEqual({ groupId: GROUP, loaded: false, items: [] });
  });

  it('empties the feed when the group changes', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const feedChanged = await effects.run($feedChanged);

    groupViewed(GROUP);
    feedChanged(GROUP, [item('1', 'hello')]);
    groupViewed(OTHER);

    expect(feed).toEqual({ groupId: OTHER, loaded: false, items: [] });
  });

  it('keeps the feed when asked for the group it already shows', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const feedChanged = await effects.run($feedChanged);

    groupViewed(GROUP);
    feedChanged(GROUP, [item('1', 'hello')]);
    groupViewed(GROUP);

    expect(feed.loaded).toBe(true);
    expect(feed.items).toHaveLength(1);
  });
});

describe('$feedChanged', () => {
  it('replaces the items of the group on screen', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const feedChanged = await effects.run($feedChanged);

    groupViewed(GROUP);
    feedChanged(GROUP, [item('1', 'first')]);
    feedChanged(GROUP, [item('2', 'second')]);

    expect(feed.loaded).toBe(true);
    expect(feed.items.map((it) => it.body)).toEqual(['second']);
  });

  it('ignores an answer for a group the page has left', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const feedChanged = await effects.run($feedChanged);

    groupViewed(OTHER);
    feedChanged(GROUP, [item('1', 'stale')]);

    expect(feed).toEqual({ groupId: OTHER, loaded: false, items: [] });
  });
});

describe('normalizeBody', () => {
  it('trims what surrounds the body, and keeps what is inside it', () => {
    expect(normalizeBody('  two\nlines  ')).toBe('two\nlines');
  });

  it('refuses nothing, and too much', () => {
    expect(normalizeBody('   ')).toBeNull();
    expect(normalizeBody('x'.repeat(ITEM_MAX_LENGTH))).not.toBeNull();
    expect(normalizeBody('x'.repeat(ITEM_MAX_LENGTH + 1))).toBeNull();
  });
});

describe('linkOf', () => {
  it('finds a web address that is the whole body', () => {
    expect(linkOf('https://example.com/a?b=c')).toBe(
      'https://example.com/a?b=c',
    );
    expect(linkOf('http://example.com')).toBe('http://example.com/');
  });

  it('refuses anything that is not only a web address', () => {
    expect(linkOf('see https://example.com')).toBeNull();
    expect(linkOf('just a note')).toBeNull();
    expect(linkOf('javascript:alert(1)')).toBeNull();
    expect(linkOf('data:text/html,hi')).toBeNull();
  });
});
