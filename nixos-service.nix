{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.madcheetah-scraper;

  src = pkgs.fetchFromGitHub {
    owner = cfg.github.owner;
    repo = cfg.github.repo;
    rev = cfg.github.rev;
    sha256 = lib.fakeSha256;  # Replace with actual hash after first build
  };

  package = pkgs.stdenv.mkDerivation {
    pname = "madcheetah-scraper";
    version = "dev";
    inherit src;

    buildInputs = [ pkgs.nodejs pkgs.npm ];

    buildPhase = ''
      npm ci --production=false
    '';

    installPhase = ''
      mkdir -p $out
      cp -r . $out/

      # Create wrapper script
      mkdir -p $out/bin
      cat > $out/bin/madcheetah-scraper <<EOF
      #!/bin/sh
      cd $out
      export NODE_ENV=development
      exec ${pkgs.nodejs}/bin/npm run server
      EOF
      chmod +x $out/bin/madcheetah-scraper
    '';
  };
in

{
  options.services.madcheetah-scraper = {
    enable = mkEnableOption "MadCheetah Scraper service";

    user = mkOption {
      type = types.str;
      default = "madcheetah";
      description = "User to run the service as";
    };

    group = mkOption {
      type = types.str;
      default = "madcheetah";
      description = "Group to run the service as";
    };

    dataDir = mkOption {
      type = types.path;
      default = "/var/lib/madcheetah-scraper";
      description = "Directory to store application data";
    };

    port = mkOption {
      type = types.port;
      default = 3000;
      description = "Port to listen on";
    };

    environmentFile = mkOption {
      type = types.nullOr types.path;
      default = null;
      description = "Environment file containing secrets";
    };

    # New option for GitHub repo details
    github = {
      owner = mkOption {
        type = types.str;
        description = "GitHub repository owner";
      };

      repo = mkOption {
        type = types.str;
        description = "GitHub repository name";
      };

      rev = mkOption {
        type = types.str;
        default = "main";
        description = "Git revision to use";
      };
    };
  };

  config = mkIf cfg.enable {
    users.users.${cfg.user} = {
      isSystemUser = true;
      group = cfg.group;
      home = cfg.dataDir;
      createHome = true;
    };

    users.groups.${cfg.group} = {};

    systemd.services.madcheetah-scraper = {
      description = "MadCheetah Scraper Service";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];

      serviceConfig = {
        Type = "simple";
        User = cfg.user;
        Group = cfg.group;
        WorkingDirectory = cfg.dataDir;
        ExecStart = "${package}/bin/madcheetah-scraper";
        Restart = "on-failure";
        RestartSec = "5s";

        # Security settings
        NoNewPrivileges = true;
        PrivateTmp = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        ReadWritePaths = [ cfg.dataDir ];

        # Environment
        Environment = [
          "PORT=${toString cfg.port}"
          "NODE_ENV=production"
        ];
      } // optionalAttrs (cfg.environmentFile != null) {
        EnvironmentFile = cfg.environmentFile;
      };
    };

    # Daily restart timer at 2 AM
    systemd.timers.madcheetah-scraper-restart = {
      description = "Restart MadCheetah Scraper daily at 2 AM";
      wantedBy = [ "timers.target" ];
      timerConfig = {
        OnCalendar = "*-*-* 02:00:00";
        Persistent = true;
      };
    };

    systemd.services.madcheetah-scraper-restart = {
      description = "Restart MadCheetah Scraper service";
      serviceConfig = {
        Type = "oneshot";
        ExecStart = "${pkgs.systemd}/bin/systemctl restart madcheetah-scraper.service";
      };
    };
  };
}
