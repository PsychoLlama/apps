{
  description = "Development environment";

  inputs = {
    systems.url = "github:nix-systems/default";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      fenix,
      systems,
    }:

    let
      inherit (nixpkgs) lib;

      overlays = [ fenix.overlays.default ];

      eachSystem = lib.flip lib.mapAttrs (
        lib.genAttrs (import systems) (
          system:
          import nixpkgs {
            inherit system overlays;
          }
        )
      );
    in

    {
      devShells = eachSystem (
        system: pkgs:
        let
          # `chromium-lock <cmd…>` runs a command under an exclusive,
          # machine-wide lock so only one browser suite drives Chromium at a
          # time. The per-package `test:browser` scripts wrap `vitest` in it:
          # turbo's `--concurrency` only bounds a single invocation, so it
          # can't stop parallel browser runs from stampeding each other across
          # packages or worktrees. Folding the lock policy (locker, path,
          # timeout) into one wrapper keeps the package scripts down to
          # `chromium-lock vitest …` and gives the policy a single home next to
          # where its locker is provisioned. s6-setlock takes an exclusive lock
          # (blocking by default); `-t` caps the wait in ms, and it releases
          # the lock when the wrapped process exits. The wait cap defaults to
          # 5min but honours `TEST_SUITE_TIMEOUT` (ms) so a slow machine or a
          # deliberately-serialized batch can widen it without editing the
          # flake. Referenced by store path so `chromium-lock` is the only
          # thing that lands on `PATH`.
          chromium-lock = pkgs.writers.writeDashBin "chromium-lock" ''
            exec ${pkgs.s6}/bin/s6-setlock -t "''${TEST_SUITE_TIMEOUT:-300000}" /tmp/psychollama-apps.chromium.lock "$@"
          '';
        in
        rec {
          default = pkgs.mkShell {
            # `ring` (pulled in by iroh's TLS backend in `@crate/iroh`)
            # compiles crypto C to wasm, which needs a clang targeting
            # wasm32. nix's *wrapped* clang injects host hardening flags
            # (`-fzero-call-used-regs=…`) the wasm target rejects, so point
            # ring's per-target `cc`/`ar` at the unwrapped LLVM tools.
            # Scoped to the wasm32 target vars, so native C builds keep
            # using gcc, and referenced by store path so the LLVM tools
            # stay off `PATH` and don't shadow the gcc binutils native
            # builds rely on. In the shellHook rather than as plain env
            # attrs because only the hook (not arbitrary attrs) propagates
            # to `coding`/`nixos` through `inputsFrom`.
            shellHook = ''
              export CC_wasm32_unknown_unknown="${pkgs.llvmPackages.clang-unwrapped}/bin/clang"
              export AR_wasm32_unknown_unknown="${pkgs.llvmPackages.bintools-unwrapped}/bin/llvm-ar"
            '';

            packages = [
              pkgs.nodejs
              # Source of truth for the pnpm version. Keep package.json's
              # `packageManager` major in sync: turbo reads it to select the
              # lockfile parser (pnpm9). See `managePackageManagerVersions`
              # in pnpm-workspace.yaml.
              pkgs.pnpm
              pkgs.treefmt
              # Rust toolchain via fenix: the stable `default` profile plus
              # the wasm32 target CI compiles crates against. Lives in
              # `default` so CI builds and the higher shells (`coding`,
              # `nixos`) all inherit it through `inputsFrom`.
              (pkgs.fenix.combine [
                pkgs.fenix.stable.defaultToolchain
                pkgs.fenix.targets.wasm32-unknown-unknown.stable.rust-std
              ])
              # Test runner for the native crate tests (`cargo:test` →
              # `cargo nextest run`). Lives in `default` so CI, which only
              # enters this shell, has it. nextest doesn't run doctests, but
              # the crates are `cdylib`-only (no doctests), so nothing is lost.
              pkgs.cargo-nextest
              # Generates the JS bindings for wasm crates that use
              # `wasm-bindgen` (e.g. `@crate/qr-scanner`). The CLI refuses
              # modules built against a mismatched `wasm-bindgen` crate,
              # so the crate pins `wasm-bindgen = "=0.2.121"` to match
              # the version nixpkgs ships here.
              pkgs.wasm-bindgen-cli
              # Serializes Chromium across the per-package `test:browser`
              # scripts (see the wrapper's definition above). Lives in
              # `default` so CI (which only enters this shell) has it.
              chromium-lock
            ];
          };

          # Tools that only matter when a human (or coding agent) is
          # actively iterating on the source — fast linters, hooks,
          # editor helpers. Layered on top of `default` so CI's closure
          # stays minimal: `pnpm lint` runs the slow full-graph eslint
          # pass, and CI doesn't run Claude hooks.
          coding = pkgs.mkShell {
            inputsFrom = [ default ];

            packages = [
              # Resident eslint daemon. Claude's post-edit hook
              # (.claude/hooks/lint-on-edit) lints a single file in a
              # few hundred ms instead of paying Node startup + config
              # evaluation each time.
              pkgs.eslint_d
              # `jq` parses Claude's PostToolUse JSON payload from
              # stdin and emits the structured `additionalContext`
              # response back out.
              pkgs.jq
              # Rust language server, matched to the stable channel. Kept
              # out of `default` so CI's closure doesn't pull it in.
              pkgs.fenix.stable.rust-analyzer
            ];

            # Point Rust's build cache at the primary checkout's `target/`
            # so every worktree shares one cache — a fresh worktree reuses
            # already-compiled dependencies instead of paying a cold build.
            # `--git-common-dir` resolves to the primary repo's `.git` from
            # any linked worktree, so all worktrees (and the main checkout)
            # agree on the same path without hard-coding it. Scoped to the
            # `coding` shell so CI, which only enters `default`, keeps
            # building into the workspace's own `target/`. Guarded so a
            # git-less or non-repo environment falls back to cargo's default.
            shellHook = ''
              if _git_common="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)"; then
                export CARGO_TARGET_DIR="$(dirname "$_git_common")/target"
                unset _git_common
              fi
            '';
          };

          # NixOS-only deps and env that don't belong in CI's closure.
          # Pulls in the coding shell so local development gets the
          # agent tooling automatically.
          nixos = pkgs.mkShell {
            inputsFrom = [
              default
              coding
            ];

            packages = [
              pkgs.patchelf
            ];

            # Playwright ships its own chromium, but the prebuilt binary can't
            # run on NixOS. Layered in for local browser tests (vitest's
            # `browser` project); consumed via CHROMIUM_PATH.
            CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";

            # Workerd ships as a generic-Linux ELF that NixOS can't load
            # without a real dynamic linker. The root `prepare` script
            # (`workspace patch-workerd`) shells out to this to rewrite the
            # binary's interpreter and rpath, sourced from the WORKERD_* vars
            # below.
            WORKERD_DYNAMIC_LOADER = "${pkgs.glibc}/lib/ld-linux-x86-64.so.2";
            WORKERD_BINARY_LIBS = lib.makeLibraryPath [ pkgs.glibc ];

            # workerd's BoringSSL doesn't read NixOS's system CA store, so any
            # `fetch()` from inside `wrangler dev` fails with "TLS peer's
            # certificate is not trusted". Pointing `SSL_CERT_FILE` at the
            # nixpkgs cacert bundle restores trust without depending on
            # `/etc/ssl/...` being populated. Set via `shellHook` because
            # stdenv unsets `SSL_CERT_FILE` on entry to keep builds from
            # trusting host certs — an mkShell attribute would be wiped.
            # https://github.com/cloudflare/workers-sdk/issues/3264
            shellHook = ''
              export SSL_CERT_FILE="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            '';
          };
        }
      );
    };
}
