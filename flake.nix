{
  description = "MadCheetah Scraper - Web scraper service with daily scheduling";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = "madcheetah-scraper";
          version = "dev";
          src = ./.;

          npmDepsHash = "sha256-xc5YEv9VsX89zSXIwPyvino0+RjJ/bCo4l0D5Nj6hIQ="; # Replace with actual hash after first build

          buildPhase = ''
            runHook preBuild
            npm run build 2>/dev/null || echo "No build script found, skipping"
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            mkdir -p $out
            cp -r . $out/

            # Create wrapper script
            mkdir -p $out/bin
            cat > $out/bin/madcheetah-scraper <<EOF
            #!/bin/sh
            cd $out
            export NODE_ENV=production
            exec ${pkgs.nodejs_20}/bin/npm run server
            EOF
            chmod +x $out/bin/madcheetah-scraper

            runHook postInstall
          '';

          meta = {
            description = "MadCheetah Scraper service";
            platforms = pkgs.lib.platforms.linux;
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.nodejs_20 ];
        };
      }
    ) // {
      nixosModules.default = import ./nixos-service.nix;
    };
}
