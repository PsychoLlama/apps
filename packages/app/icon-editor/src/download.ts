/**
 * Browser download helpers for the rendered icon. Both functions
 * trigger a synthetic anchor click — the browser handles the rest.
 */

/** Save an SVG document as a `.svg` file. */
export const downloadSvg = (svg: string, filename: string): void => {
  triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), filename);
};

/**
 * Rasterize an SVG to PNG at the requested pixel size, then save it.
 *
 * The SVG must declare its `width`/`height` matching `sizePx`: an
 * `<img>`-loaded SVG is rasterized once at intrinsic dimensions, so a
 * mismatch (e.g. a 512-wide SVG drawn into a 1024 canvas) goes through
 * a resample step and lands soft. The caller is responsible for
 * rendering the SVG at the target size — `renderIconSvg(state, { size:
 * sizePx })` does the right thing.
 *
 * The output canvas backing store is exactly `sizePx × sizePx`, so the
 * PNG file dimensions match `sizePx` regardless of device pixel ratio.
 * DPR only matters when displaying a canvas — this canvas is never
 * shown, only `toBlob()`d.
 */
export const downloadPng = async (
  svg: string,
  sizePx: number,
  filename: string,
): Promise<void> => {
  const svgUrl = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml' }),
  );
  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(image, 0, 0, sizePx, sizePx);
    const png = await canvasToBlob(canvas);
    triggerDownload(png, filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load icon SVG'));
    img.src = url;
  });
};

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed'));
    }, 'image/png');
  });
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
