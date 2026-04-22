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

          # Playwright ships its own chromium, but the prebuilt binary can't
          # run on NixOS. This shell layers on a nixpkgs chromium for local
          # storybook browser tests. CI sticks with the default shell to
          # keep chromium out of the nix cache closure.
          nixos = pkgs.mkShell {
            inputsFrom = [ default ];
            packages = [ pkgs.chromium ];
            CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";
          };
        }
      );
    };
}
