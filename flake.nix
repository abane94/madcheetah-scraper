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

          npmDepsHash = "sha256-xc5YEv9VsX89zSXIwPyvino0+RjJ/bCo4l0D5Nj6hIQ=";

          buildInputs = [ pkgs.chromium ];

          # Set environment variables before npm install
          npmFlags = [ "--offline" ];

          prePatch = ''
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_SKIP_DOWNLOAD=1
            export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
          '';

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
            export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_SKIP_DOWNLOAD=1
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
          buildInputs = [ pkgs.nodejs_20 pkgs.chromium ];
          shellHook = ''
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_SKIP_DOWNLOAD=1
            export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
          '';
        };
      }
    ) // {
      nixosModules.default = import ./nixos-service.nix;
    };
}
