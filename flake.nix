{
  description = "Development environment";

  inputs = {
    systems.url = "github:nix-systems/default";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
      systems,
    }:

    let
      inherit (nixpkgs) lib;

      eachSystem = lib.flip lib.mapAttrs (
        lib.genAttrs (import systems) (system: nixpkgs.legacyPackages.${system})
      );
    in

    {
      devShells = eachSystem (
        system: pkgs: rec {
          default = pkgs.mkShell {
            packages = [
              pkgs.moon
              pkgs.nodejs
              pkgs.pnpm
              pkgs.treefmt
            ];
          };

          # Tools that only matter when a human (or coding agent) is
          # actively iterating on the source — fast linters, hooks,
          # editor helpers. Layered on top of `default` so CI's closure
          # stays minimal: `moon run :lint` already runs the slow
          # full-graph eslint pass, and CI doesn't run Claude hooks.
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
            ];
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
            # run on NixOS. Layered in for local storybook browser tests;
            # consumed via CHROMIUM_PATH.
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
