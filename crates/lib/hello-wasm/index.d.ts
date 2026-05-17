/** Linear-memory accessors exported by the hello-wasm module. */
export interface HelloExports {
  memory: WebAssembly.Memory;
  message_ptr(): number;
  message_len(): number;
}

/**
 * Initialize the hello-wasm module via Vite's `?init` helper. The
 * resolved instance's `exports` are typed to {@link HelloExports}.
 */
declare const init: (
  options?: WebAssembly.Imports,
) => Promise<{ readonly exports: HelloExports }>;

export default init;
