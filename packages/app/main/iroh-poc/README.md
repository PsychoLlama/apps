# iroh-poc

Browser-side iroh chat POC. Compiles a small chat protocol to wasm and
exposes it to JS via `wasm-bindgen`. The route at `/iroh-poc` (in
`@app/main`) loads the resulting bundle dynamically inside `onMount`
so the iroh runtime never gets pulled into SSR / prerender.

The page hosts an n0-relay-backed endpoint and surfaces a JSON connect
ticket (endpoint id + home-relay URL). Both sides use the same
symmetric `Session` handle: dialing returns one, accepting yields one
through `EchoNode.sessions()`. Each chat message rides its own
short-lived unidirectional stream — `read_to_end` provides framing
for free, and concurrent `send` calls multiplex naturally.

## Build

The wasm bundle isn't checked in. Generate it via the dedicated nix dev
shell — it ships rust + the wasm32 target + matching `wasm-bindgen-cli`

- clang + `llvm-ar` (ring's C glue needs a wasm-capable C toolchain or
  the `ring_core_*` symbols become unsatisfiable `env` imports) +
  binaryen (for `wasm-opt`).

### Release (~2 MB raw, ~720 KB brotli)

This is what you want most of the time — it's small enough to load
quickly and the runtime perf is dramatically better than debug.

```sh
# from the worktree root:
nix develop ./packages/app/main/iroh-poc --command bash -c '
  cd packages/app/main/iroh-poc &&
  cargo build --release --target wasm32-unknown-unknown &&
  wasm-bindgen ./target/wasm32-unknown-unknown/release/iroh_poc.wasm \
    --out-dir=pkg --weak-refs --target=web &&
  wasm-opt --enable-nontrapping-float-to-int --enable-bulk-memory \
    --strip-debug --strip-dwarf -Oz \
    -o pkg/iroh_poc_bg.wasm pkg/iroh_poc_bg.wasm
'
```

### Debug (~14 MB raw)

Keeps panics + names readable. Skip `wasm-opt` and pass `--debug` so
`wasm-bindgen` preserves DWARF.

```sh
nix develop ./packages/app/main/iroh-poc --command bash -c '
  cd packages/app/main/iroh-poc &&
  cargo build --target wasm32-unknown-unknown &&
  wasm-bindgen ./target/wasm32-unknown-unknown/debug/iroh_poc.wasm \
    --out-dir=pkg --weak-refs --target=web --debug
'
```

Either way, `pnpm dev` (or `moon run @app/main:dev`) then serves
`/iroh-poc` with the freshly generated bundle — Vite picks up
`pkg/iroh_poc.js` and the sibling `iroh_poc_bg.wasm` automatically.

## Size notes

- `tracing-subscriber` and `tracing-subscriber-wasm` are deliberately
  omitted; they pull in regex/formatter machinery that nearly doubles
  the wasm. The `release_max_level_off` feature on the `tracing` crate
  turns iroh's internal log calls into compile-time no-ops in release
  builds, so we don't need a subscriber at all.
- `Cargo.toml`'s release profile is tuned for size: `opt-level = "z"`,
  `lto = true`, `codegen-units = 1`, `panic = "abort"`,
  `strip = "symbols"`.
- Most of the remaining bytes are ring (crypto) and quinn/iroh-relay.
  Cutting deeper means swapping the TLS backend or trimming
  `webpki-roots`, neither of which is worth it for a POC.
