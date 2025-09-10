{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.madcheetah-scraper;
in

{
  options.services.madcheetah-scraper = {
    enable = mkEnableOption "MadCheetah Scraper service";

    package = mkOption {
      type = types.package;
      description = "MadCheetah Scraper package to use";
    };

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
        ExecStart = "${cfg.package}/bin/madcheetah-scraper";
        Restart = "on-failure";
        RestartSec = "5s";

        # Security settings
        NoNewPrivileges = true;
        PrivateTmp = true;
        ProtectSystem = "strict";
        ReadWritePaths = [ cfg.dataDir "/tmp" ];

        # Allow access to devices needed by Chromium
        PrivateDevices = false;
        ProtectKernelModules = true;
        ProtectKernelTunables = true;
        ProtectControlGroups = true;

        # Environment
        Environment = [
          "PORT=${toString cfg.port}"
          "NODE_ENV=production"
          "DISPLAY=:99"
          "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1"
          "PUPPETEER_SKIP_DOWNLOAD=1"
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
