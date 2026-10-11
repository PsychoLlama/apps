/**
 * The `@lib/state` surface backing the reader: one camera session and
 * the decoder worker that serves it, both owned by {@link readerScope}.
 * Anchoring that scope is what keeps the page alive; releasing the last
 * anchor stops the stream, terminates the worker, and aborts whatever was
 * still in flight.
 */
export { readerScope } from './scope';
export { cameraStore, streamCell, type CameraErrorKind } from './camera';
export { decoderCell } from './decoder';
export {
  autoStartScanSaga,
  finishScanSaga,
  preloadDecoderSaga,
  reportSagaFailure,
  startScanSaga,
  stopScanSaga,
  toggleTorchSaga,
} from './sagas';
