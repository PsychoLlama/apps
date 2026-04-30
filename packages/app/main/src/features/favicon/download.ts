/**
 * Browser download helpers for the rendered favicon. Both functions
 * trigger a synthetic anchor click — the browser handles the rest.
 */

/** Save an SVG document as a `.svg` file. */
export const downloadSvg = (svg: string, filename: string): void => {
  triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), filename);
};

/**
 * Rasterize an SVG to PNG at the requested pixel size, then save it.
 * The SVG is loaded as an `Image` and drawn into a `<canvas>`.
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
    img.onerror = () => reject(new Error('Failed to load favicon SVG'));
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
