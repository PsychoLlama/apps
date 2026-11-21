import type { Item } from '@crate/beam';
import { RUN_GAP, dayOf, timeline } from '../timeline';

const MINUTE = 60 * 1000;
const NOON = new Date(2026, 10, 18, 12).getTime();

const item = (id: string, author: string, createdAt: number): Item => ({
  id,
  body: id,
  author,
  createdAt,
  committed: true,
  file: undefined,
});

/** The ids in each run of each day. */
const shape = (items: Item[]) =>
  timeline(items).map((day) =>
    day.runs.map((run) => run.items.map((it) => it.id)),
  );

describe('timeline', () => {
  it('gives an item the app wrote a sitting of its own', () => {
    const items = [
      { ...item('welcome', 'laptop', NOON), system: 'welcome' },
      item('a', 'laptop', NOON + MINUTE),
      item('b', 'laptop', NOON + 2 * MINUTE),
    ];

    expect(shape(items)).toEqual([[['welcome'], ['a', 'b']]]);
    expect(timeline(items)[0]?.runs.map((run) => run.system)).toEqual([
      true,
      false,
    ]);
  });

  it('is empty for an empty feed', () => {
    expect(timeline([])).toEqual([]);
  });

  it('keeps what one device shares in one sitting together', () => {
    const items = [
      item('a', 'laptop', NOON),
      item('b', 'laptop', NOON + MINUTE),
      item('c', 'laptop', NOON + 14 * MINUTE),
    ];

    expect(shape(items)).toEqual([[['a', 'b', 'c']]]);
  });

  it('starts a sitting when another device shares', () => {
    const items = [
      item('a', 'laptop', NOON),
      item('b', 'phone', NOON + MINUTE),
      item('c', 'laptop', NOON + 2 * MINUTE),
    ];

    expect(shape(items)).toEqual([[['a'], ['b'], ['c']]]);
  });

  it('starts a sitting after a long enough pause', () => {
    const items = [
      item('a', 'laptop', NOON),
      item('b', 'laptop', NOON + RUN_GAP),
    ];
    const [day] = timeline(items);

    expect(shape(items)).toEqual([[['a'], ['b']]]);
    expect(day?.runs[1]).toMatchObject({
      author: 'laptop',
      startedAt: NOON + RUN_GAP,
    });
  });

  it('measures the pause from the last item, not the first', () => {
    const items = [
      item('a', 'laptop', NOON),
      item('b', 'laptop', NOON + 10 * MINUTE),
      item('c', 'laptop', NOON + 20 * MINUTE),
    ];

    expect(shape(items)).toEqual([[['a', 'b', 'c']]]);
  });

  it('splits at local midnight, even mid-sitting', () => {
    const midnight = dayOf(NOON) + 24 * 60 * MINUTE;
    const items = [
      item('a', 'laptop', midnight - MINUTE),
      item('b', 'laptop', midnight + MINUTE),
    ];

    expect(shape(items)).toEqual([[['a']], [['b']]]);
    expect(timeline(items).map((day) => day.day)).toEqual([
      dayOf(NOON),
      midnight,
    ]);
  });
});
