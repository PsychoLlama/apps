/**
 * Pack ordering for the picker. Alphabetical buries the polished
 * material/UI packs the editor is mostly used with — this groups by
 * iconify's category, leads with the canonical Material family,
 * pushes the archive to the bottom, and breaks ties on icon count
 * so larger / more useful packs sort up within each tier.
 */

import type { CollectionsJson } from './iconify.ts';

const TIER_ORDER: ReadonlyArray<string> = [
  'Material',
  'UI 24px',
  'UI 16px / 32px',
  'UI Other / Mixed Grid',
  'Thematic',
  'Programming',
  'Flags / Maps',
];

const FALLBACK_TIER = TIER_ORDER.length;
const ARCHIVE_TIER = FALLBACK_TIER + 1;

const tierOf = (category: string | undefined): number => {
  if (category === 'Archive / Unmaintained') return ARCHIVE_TIER;
  if (!category) return FALLBACK_TIER;
  const idx = TIER_ORDER.indexOf(category);
  return idx === -1 ? FALLBACK_TIER : idx;
};

/** Pack-comparator input — anything carrying name/total/category works. */
export interface PackOrderingFields {
  name: string;
  total: number;
  category?: string;
}

/**
 * Compare two packs for ordering: tier ascending, total descending,
 * name ascending. Stable enough for `Array.prototype.sort`.
 */
export const comparePackOrder = (
  left: PackOrderingFields,
  right: PackOrderingFields,
): number => {
  const tierDelta = tierOf(left.category) - tierOf(right.category);
  if (tierDelta !== 0) return tierDelta;
  const totalDelta = right.total - left.total;
  if (totalDelta !== 0) return totalDelta;
  return left.name.localeCompare(right.name, 'en');
};

/** Sort pack ids by {@link comparePackOrder} using their collection metadata. */
export const sortedPackIds = (collections: CollectionsJson): string[] =>
  Object.keys(collections).sort((leftId, rightId) =>
    comparePackOrder(
      {
        name: collections[leftId].name,
        total: collections[leftId].total ?? 0,
        category: collections[leftId].category,
      },
      {
        name: collections[rightId].name,
        total: collections[rightId].total ?? 0,
        category: collections[rightId].category,
      },
    ),
  );
