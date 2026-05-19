import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

const WASM_PATH = fileURLToPath(
  // The package's `./index_bg.wasm` export resolves to the wasm
  // sibling regardless of where pnpm hoists the package.
  import.meta.resolve('@resvg/resvg-wasm/index_bg.wasm'),
);

let wasmReady: Promise<void> | undefined;

/**
 * Initialize the resvg WASM module exactly once per process. Both
 * `svg-to-png` and `pwa-manifest` rasterize through the same WASM,
 * and `initWasm` throws on the second call — share the init promise
 * so concurrent plugins coexist.
 */
export const ensureResvgWasm = (): Promise<void> => {
  wasmReady ??= readFile(WASM_PATH).then(initWasm);
  return wasmReady;
};

/** Rasterize an SVG string to a PNG buffer at the given square size. */
export const rasterizeSvg = async (
  svg: string,
  size: number,
): Promise<Uint8Array> => {
  await ensureResvgWasm();
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    // The brandmark is a flat geometric shape — no fonts to embed,
    // no need to slow down rendering on text quality knobs.
    font: { loadSystemFonts: false },
  });
  return renderer.render().asPng();
};
