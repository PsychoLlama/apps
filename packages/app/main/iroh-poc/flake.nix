{
  description = "Iroh POC — rust toolchain for the browser-side echo demo";

  inputs = {
    rust-overlay.url = "github:oxalica/rust-overlay";
    systems.url = "github:nix-systems/default";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
      rust-overlay,
      systems,
    }:

    let
      inherit (nixpkgs) lib;

      overlays = [ (import rust-overlay) ];

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
        system: pkgs: {
          default = pkgs.mkShell {
            packages = [
              # `wasm32-unknown-unknown` is added via `rust-toolchain.toml`'s
              # `targets` field, so this gives us cargo + rustc + the wasm
              # std crate in one go.
              (pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml)
              # `wasm-bindgen-cli` must match the `wasm-bindgen` crate
              # version in `Cargo.toml` exactly — pin both together.
              pkgs.wasm-bindgen-cli
              pkgs.binaryen
              # `ring`'s `build.rs` needs clang + `llvm-ar` to compile
              # its C glue to wasm. Without them the `ring_core_*`
              # symbols become `env` imports the host has to provide,
              # which breaks instantiation in the browser. Set
              # `CC_wasm32_unknown_unknown=clang` and
              # `AR_wasm32_unknown_unknown=llvm-ar` before `cargo build`.
              pkgs.llvmPackages.clang-unwrapped
              pkgs.llvmPackages.bintools
              pkgs.llvmPackages.lld
            ];
          };
        }
      );
    };
}
