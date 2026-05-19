import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import type { BarcodeDetection } from './barcode-detector';
import type { ParsedPayload } from './parsers';

/** Lifecycle states the scanner walks through. */
export type ScannerStatus =
  | 'probing'
  | 'unsupported'
  | 'idle'
  | 'requesting-camera'
  | 'scanning'
  | 'detected'
  | 'error';

/** Intrinsic dimensions of the video frame the detection was made against. */
export interface VideoSize {
  width: number;
  height: number;
}

/** Bundled detection — raw API result + the parsed interpretation. */
export interface ScannerDetection {
  /** Original `BarcodeDetection` returned by `BarcodeDetector.detect`. */
  raw: BarcodeDetection;
  /** Parsed, typed interpretation of `raw.rawValue`. */
  parsed: ParsedPayload;
  /** Video dimensions at capture time — used to size the polygon overlay. */
  videoSize: VideoSize;
}

/** Snapshot of the scanner POC. */
export interface ScannerState {
  /** Current lifecycle phase. Drives which UI branch renders. */
  status: ScannerStatus;
  /** Formats the platform reports it can decode. Empty until probed. */
  supportedFormats: ReadonlyArray<string>;
  /** Frozen detection while in `'detected'`, cleared on restart. */
  detection: ScannerDetection | undefined;
  /** Last error message — populated only when `status === 'error'`. */
  errorMessage: string | undefined;
}

const initial: ScannerState = {
  status: 'probing',
  supportedFormats: [],
  detection: undefined,
  errorMessage: undefined,
};

const scannerStore = defineStore<ScannerState>(() => ({ ...initial }));

/** Live, readonly view of the scanner POC state. */
export const scanner = createStore(scannerStore);

const markUnsupportedAction = defineAction([scannerStore], (state) => {
  state.status = 'unsupported';
});

const markSupportedAction = defineAction(
  [scannerStore],
  (state, formats: ReadonlyArray<string>) => {
    state.supportedFormats = formats;
    state.status = 'idle';
  },
);

const markRequestingCameraAction = defineAction([scannerStore], (state) => {
  state.status = 'requesting-camera';
});

const markScanningAction = defineAction([scannerStore], (state) => {
  state.status = 'scanning';
  state.detection = undefined;
});

const recordDetectionAction = defineAction(
  [scannerStore],
  (state, detection: ScannerDetection) => {
    state.status = 'detected';
    state.detection = detection;
  },
);

const recordErrorAction = defineAction(
  [scannerStore],
  (state, message: string) => {
    state.status = 'error';
    state.errorMessage = message;
  },
);

/** Component-facing handle for the scanner actions. */
export interface ScannerActions {
  markUnsupported: () => void;
  markSupported: (formats: ReadonlyArray<string>) => void;
  markRequestingCamera: () => void;
  markScanning: () => void;
  recordDetection: (detection: ScannerDetection) => void;
  recordError: (message: string) => void;
}

/** Bind every scanner action in a single hook call. */
export const useScannerActions = (): ScannerActions => ({
  markUnsupported: useAction(markUnsupportedAction),
  markSupported: useAction(markSupportedAction),
  markRequestingCamera: useAction(markRequestingCameraAction),
  markScanning: useAction(markScanningAction),
  recordDetection: useAction(recordDetectionAction),
  recordError: useAction(recordErrorAction),
});
