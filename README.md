# MadCheetah Scraper

Web scraper service with daily scheduling capabilities using Puppeteer and Chromium.

## NixOS Deployment

1. Add this flake as an input to your NixOS configuration:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    madcheetah-scraper.url = "github:abane94/madcheetah-scraper";
  };
}
```

2. Import the service module in your NixOS configuration:

```nix
{ inputs, ... }:
{
  imports = [
    inputs.madcheetah-scraper.nixosModules.default
  ];

  services.madcheetah-scraper = {
    enable = true;
    package = inputs.madcheetah-scraper.packages.${pkgs.system}.default;
    port = 3000;
    user = "madcheetah";
    dataDir = "/var/lib/madcheetah-scraper";
    imagesDir = "/var/lib/madcheetah-scraper/images";
    environmentFile = "/etc/madcheetah-scraper/env"; # Optional
  };
}
```

## Configuration Options

All configuration options available for the NixOS service:

- `enable`: Enable the MadCheetah Scraper service
- `package`: Package to use (usually from the flake)
- `port`: Port to listen on (default: 3000)
- `user`: System user to run the service as (default: "madcheetah")
- `group`: System group to run the service as (default: "madcheetah")
- `dataDir`: Directory to store application data (default: "/var/lib/madcheetah-scraper")
- `imagesDir`: Directory to store scraped images (default: "/var/lib/madcheetah-scraper/images")
- `environmentFile`: Optional path to environment file containing secrets

### Example with Custom Directories

```nix
services.madcheetah-scraper = {
  enable = true;
  package = inputs.madcheetah-scraper.packages.${pkgs.system}.default;
  port = 8080;
  dataDir = "/srv/madcheetah/data";
  imagesDir = "/srv/madcheetah/images";
  user = "scraper";
  group = "scraper";
};
```

3. The service will automatically restart daily at 2 AM.

**Note:** The service includes Chromium for web scraping functionality and runs in headless mode.

## Development

```bash
nix develop
npm run dev
```

```
open http://localhost:3000
```
