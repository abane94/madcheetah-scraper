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

          npmDepsHash = "sha256-fLwyiq5R8vh9A4xD0DykAyPf7ans3a748hO2FcfzU9c=";
          # npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

          buildInputs = [ pkgs.chromium pkgs.bash ];
          nativeBuildInputs = [ pkgs.makeWrapper ];

          # Set environment variables before npm install
          npmFlags = [ "--offline" ];

          prePatch = ''
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_SKIP_DOWNLOAD=1
            export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
          '';

          buildPhase = ''
            runHook preBuild
            npm run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            mkdir -p $out
            cp -r . $out/

            # Create wrapper script to run the built server
            mkdir -p $out/bin
            makeWrapper ${pkgs.nodejs_20}/bin/node $out/bin/madcheetah-scraper \
              --chdir $out \
              --run 'export DATA_DIR=''${DATA_DIR:-./data}' \
              --run 'export IMAGES_DIR=''${IMAGES_DIR:-./images}' \
              --run 'export PORT=''${PORT:-3000}' \
              --set NODE_ENV production \
              --set PUPPETEER_EXECUTABLE_PATH ${pkgs.chromium}/bin/chromium \
              --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1 \
              --set PUPPETEER_SKIP_DOWNLOAD 1 \
              --add-flags "dist/index.js"

            runHook postInstall
          '';

          meta = {
            description = "MadCheetah Scraper service";
            platforms = pkgs.lib.platforms.linux;
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.bash pkgs.nodejs_20 pkgs.chromium ];
          shellHook = ''
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_SKIP_DOWNLOAD=1
            export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
            export DATA_DIR=./data
            export IMAGES_DIR=./images

            echo "MadCheetah Scraper development environment ready!"
            echo "Run 'npm run dev' or 'npm start' to start the service"
          '';
        };
      }
    ) // {
      nixosModules.default = import ./nixos-service.nix;
    };
}
