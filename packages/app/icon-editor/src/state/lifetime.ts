import { collect } from '@lib/effects';
import { $editor, $loading, $rail } from './editor';
import { $exportPanel } from './export';
import { $iconEntries, $picker } from './picker';

/**
 * Every store the editor screen owns, held as one. Hold it for the
 * screen's lifetime: the rail swaps panels in and out, and their state
 * (the picker's bodies, the export choices) has to outlive the swap.
 */
export const $editorLifetime = collect([
  $editor,
  $loading,
  $rail,
  $picker,
  $iconEntries,
  $exportPanel,
]);
