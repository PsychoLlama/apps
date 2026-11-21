/** Unit tests for the feed of the group on screen. */

import type { Item } from '@crate/beam';
import { createTestController } from '@lib/effects/testing';
import {
  $feed,
  $feedChanged,
  $groupViewed,
  $membersChanged,
  ITEM_MAX_LENGTH,
  linkOf,
  normalizeBody,
  openableType,
  formatBytes,
  firstPending,
  isPreviewable,
  isShown,
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

describe('isPreviewable', () => {
  it('shows the image types a browser decodes as pixels', () => {
    expect(isPreviewable({ type: 'image/png', size: 10 })).toBe(true);
    expect(isPreviewable({ type: 'image/jpeg', size: 10 })).toBe(true);
  });

  it('keeps documents, unknown types, and huge images as files', () => {
    expect(isPreviewable({ type: 'image/svg+xml', size: 10 })).toBe(false);
    expect(isPreviewable({ type: 'application/pdf', size: 10 })).toBe(false);
    expect(isPreviewable({ type: '', size: 10 })).toBe(false);
    expect(isPreviewable({ type: 'image/png', size: 64 * 1024 * 1024 })).toBe(
      false,
    );
  });
});

describe('$feed', () => {
  it('starts out looking at nothing', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);

    expect(feed).toEqual({
      groupId: null,
      loaded: false,
      items: [],
      members: [],
    });
  });
});

describe('$groupViewed', () => {
  it('turns to a group, unanswered', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);

    groupViewed(GROUP);

    expect(feed).toEqual({
      groupId: GROUP,
      loaded: false,
      items: [],
      members: [],
    });
  });

  it('empties the feed when the group changes', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const feedChanged = await effects.run($feedChanged);

    groupViewed(GROUP);
    feedChanged(GROUP, [item('1', 'hello')]);
    groupViewed(OTHER);

    expect(feed).toEqual({
      groupId: OTHER,
      loaded: false,
      items: [],
      members: [],
    });
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

    expect(feed).toEqual({
      groupId: OTHER,
      loaded: false,
      items: [],
      members: [],
    });
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

describe('firstPending', () => {
  const written = (id: string, author: string, committed: boolean): Item => ({
    ...item(id, id),
    author,
    committed,
  });

  it('finds the oldest thing this device wrote that is not final', () => {
    const items = [
      written('a', 'me', true),
      written('b', 'me', false),
      written('c', 'me', false),
    ];

    expect(firstPending(items, 'me')).toBe('b');
  });

  it('passes over what another device has yet to make final', () => {
    expect(firstPending([written('a', 'them', false)], 'me')).toBeNull();
  });

  it('finds nothing when everything is final, or the device is unknown', () => {
    expect(firstPending([written('a', 'me', true)], 'me')).toBeNull();
    expect(firstPending([written('a', 'me', false)], null)).toBeNull();
  });
});

describe('isShown', () => {
  it('shows what was shared, and the kinds of its own this build knows', () => {
    expect(isShown({})).toBe(true);
    expect(isShown({ system: 'welcome' })).toBe(true);
  });

  it('leaves out a kind from a build newer than this one', () => {
    expect(isShown({ system: 'from-the-future' })).toBe(false);
  });
});

describe('openableType', () => {
  it('opens what a browser only draws or plays', () => {
    expect(openableType({ type: 'image/png' })).toBe('image/png');
    expect(openableType({ type: 'application/pdf' })).toBe('application/pdf');
    expect(openableType({ type: 'video/mp4' })).toBe('video/mp4');
  });

  it('says for itself what encoding plain text is in', () => {
    expect(openableType({ type: 'text/plain' })).toBe(
      'text/plain;charset=utf-8',
    );
    expect(openableType({ type: 'Text/Plain; charset=utf-7' })).toBe(
      'text/plain;charset=utf-8',
    );
  });

  it('refuses anything that could run a script, and anything unknown', () => {
    expect(openableType({ type: 'text/html' })).toBeNull();
    expect(openableType({ type: 'image/svg+xml' })).toBeNull();
    expect(openableType({ type: 'application/xhtml+xml' })).toBeNull();
    expect(openableType({ type: 'application/zip' })).toBeNull();
    expect(openableType({ type: '' })).toBeNull();
  });
});

describe('formatBytes', () => {
  it('reads as people read sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1_500_000)).toBe('1.4 MB');
    expect(formatBytes(250 * 1024 * 1024)).toBe('250 MB');
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB');
  });

  it('never goes below nothing', () => {
    expect(formatBytes(-1)).toBe('0 B');
  });
});

describe('$membersChanged', () => {
  const laptop = { id: 'a1', name: 'Laptop', me: true, online: true };

  it('replaces the devices of the group on screen', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const membersChanged = await effects.run($membersChanged);

    groupViewed(GROUP);
    membersChanged(GROUP, [laptop]);

    expect(feed.members).toEqual([laptop]);
  });

  it('ignores an answer for a group the page has left', async () => {
    await using effects = createTestController();
    const feed = await effects.run($feed);
    const groupViewed = await effects.run($groupViewed);
    const membersChanged = await effects.run($membersChanged);

    groupViewed(GROUP);
    membersChanged(GROUP, [laptop]);
    groupViewed(OTHER);
    membersChanged(GROUP, [laptop]);

    expect(feed.members).toEqual([]);
  });
});
