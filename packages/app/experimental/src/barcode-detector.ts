/**
 * Minimal `BarcodeDetector` ambient types + a feature probe.
 *
 * The API is still on the Shape Detection draft and ships unevenly
 * (Chromium-only, behind platform support). `lib.dom.d.ts` doesn't
 * model it yet, so we declare just the slice we consume.
 *
 * @see https://wicg.github.io/shape-detection-api/
 */

/** A single 2D point returned in `cornerPoints`. */
export interface BarcodePoint2D {
  x: number;
  y: number;
}

/** One detection result from `BarcodeDetector.detect`. */
export interface BarcodeDetection {
  /** Decoded payload (UTF-8 string). */
  rawValue: string;
  /** Symbology — e.g. `'qr_code'`, `'code_128'`, `'ean_13'`. */
  format: string;
  /** Axis-aligned bounding box around the detected barcode. */
  boundingBox: DOMRectReadOnly;
  /** Quadrilateral hull, clockwise from top-left. */
  cornerPoints: ReadonlyArray<BarcodePoint2D>;
}

interface BarcodeDetectorOptions {
  formats?: ReadonlyArray<string>;
}

/** Instance interface for `BarcodeDetector`. */
export interface BarcodeDetectorInstance {
  detect(
    source:
      | HTMLVideoElement
      | HTMLImageElement
      | HTMLCanvasElement
      | ImageBitmap,
  ): Promise<ReadonlyArray<BarcodeDetection>>;
}

interface BarcodeDetectorConstructor {
  new (options?: BarcodeDetectorOptions): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<ReadonlyArray<string>>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

/** Return the constructor when the platform supports it, else `undefined`. */
export const getBarcodeDetector = (): BarcodeDetectorConstructor | undefined =>
  typeof window === 'undefined' ? undefined : window.BarcodeDetector;
