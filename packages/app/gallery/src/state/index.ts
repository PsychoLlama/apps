/**
 * The `@lib/state` surface backing the gallery: which permutation section
 * each listing is showing, owned by {@link galleryScope}. The tab strips
 * anchor that scope themselves, so the selections live exactly as long as a
 * manifest page has tabs on screen.
 */
export {
  FIRST_SECTION,
  galleryScope,
  galleryStore,
  sectionSelectedTopic,
} from './sections';
