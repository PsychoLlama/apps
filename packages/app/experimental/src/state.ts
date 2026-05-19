import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import type { BarcodeDetection } from './barcode-detector';

/** Lifecycle states the scanner walks through. */
export type ScannerStatus =
  | 'probing'
  | 'unsupported'
  | 'requesting-camera'
  | 'scanning'
  | 'error';

/** Snapshot of the scanner POC. */
export interface ScannerState {
  /** Current lifecycle phase. Drives which UI branch renders. */
  status: ScannerStatus;
  /** Formats the platform reports it can decode. Empty until probed. */
  supportedFormats: ReadonlyArray<string>;
  /** Most recent decoded barcode, or `undefined` before the first hit. */
  detection: BarcodeDetection | undefined;
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
    state.status = 'requesting-camera';
  },
);

const markScanningAction = defineAction([scannerStore], (state) => {
  state.status = 'scanning';
});

const recordDetectionAction = defineAction(
  [scannerStore],
  (state, detection: BarcodeDetection) => {
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
  markScanning: () => void;
  recordDetection: (detection: BarcodeDetection) => void;
  recordError: (message: string) => void;
}

/** Bind every scanner action in a single hook call. */
export const useScannerActions = (): ScannerActions => ({
  markUnsupported: useAction(markUnsupportedAction),
  markSupported: useAction(markSupportedAction),
  markScanning: useAction(markScanningAction),
  recordDetection: useAction(recordDetectionAction),
  recordError: useAction(recordErrorAction),
});
