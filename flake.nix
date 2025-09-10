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
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "madcheetah-scraper";
          version = "dev";
          src = ./.;

          buildInputs = [ pkgs.nodejs_20 ];
          nativeBuildInputs = [ pkgs.nodejs_20 ];

          buildPhase = ''
            export HOME=$TMPDIR
            ${pkgs.nodejs_20}/bin/npm ci --production=false
          '';

          installPhase = ''
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
          '';
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [ pkgs.nodejs_20 ];
        };
      }
    ) // {
      nixosModules.default = import ./nixos-service.nix;
    };
}
