/**
 * The icon being designed: its glyph, palette, shape, and padding, plus the
 * URL round-trip that makes a design shareable. Owned by
 * {@link iconEditorScope} — the route anchors it, and releasing that anchor
 * takes the design with it.
 */
export {
  editorResetTopic,
  iconEditorScope,
  iconEditorStore,
  iconPickedTopic,
  loadingStore,
  paddingChangedTopic,
  paletteChangedTopic,
  pickerClosedTopic,
  pickerOpenedTopic,
  railStore,
  shapeChangedTopic,
  shareParamsFormula,
  type IconEditorShape,
  type IconEditorState,
} from './store';
export {
  hydrateFromUrlSaga,
  randomizeIconSaga,
  selectPackSaga,
  type IconEditorUrlParams,
} from './sagas';
