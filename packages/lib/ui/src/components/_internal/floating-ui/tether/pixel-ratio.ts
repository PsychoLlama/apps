/**
 * Snap a measured coordinate to the device pixel grid, as Radix does.
 * Fractional CSS pixels blur the subject's edges on high-density
 * screens; the loss is at most half a device pixel.
 */
export const roundByDevicePixel = (value: number): number => {
  const ratio = globalThis.devicePixelRatio || 1;
  return Math.round(value * ratio) / ratio;
};
