import { createTestController } from '@lib/effects/testing';
import {
  $dropHovered,
  $dropping,
  droppedOf,
  isShareable,
  type DragPayload,
} from '../drop';

/** A drag holding `data` by format, and `files`. */
const payload = (
  data: Record<string, string>,
  files: File[] = [],
): DragPayload => ({
  types: [...Object.keys(data), ...(files.length > 0 ? ['Files'] : [])],
  files,
  getData: (format) => data[format] ?? '',
});

describe('$dropping', () => {
  it('follows a drag over the page and off it', async () => {
    await using effects = createTestController();
    const dropping = await effects.run($dropping);
    const hovered = await effects.run($dropHovered);

    expect(dropping()).toBe(false);

    hovered(true);
    expect(dropping()).toBe(true);

    hovered(false);
    expect(dropping()).toBe(false);
  });
});

describe('isShareable', () => {
  it('takes files, links, and text', () => {
    expect(isShareable({ types: ['Files'] })).toBe(true);
    expect(isShareable({ types: ['text/uri-list'] })).toBe(true);
    expect(isShareable({ types: ['text/plain'] })).toBe(true);
  });

  it('passes on a drag with nothing it could share', () => {
    expect(isShareable({ types: [] })).toBe(false);
    expect(isShareable({ types: ['application/x-thing'] })).toBe(false);
  });
});

describe('droppedOf', () => {
  it('takes the files, and not the address that came with them', () => {
    const file = new File(['x'], 'photo.png');
    const dropped = droppedOf(
      payload({ 'text/uri-list': 'https://example.com/photo.png' }, [file]),
    );

    expect(dropped).toEqual({ files: [file], text: null });
  });

  it('takes the first address of a dragged link, past any comment', () => {
    const dropped = droppedOf(
      payload({
        'text/uri-list': '# a comment\r\nhttps://example.com/a\r\nhttps://b',
        'text/plain': 'ignored',
      }),
    );

    expect(dropped.text).toBe('https://example.com/a');
  });

  it('takes dragged text as it is', () => {
    expect(droppedOf(payload({ 'text/plain': 'two\nlines' })).text).toBe(
      'two\nlines',
    );
  });

  it('finds nothing in an empty drop', () => {
    expect(droppedOf(payload({ 'text/plain': '  ' }))).toEqual({
      files: [],
      text: null,
    });
  });
});
