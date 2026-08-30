# Contributing

## How to use, on a Windows machine by installing WSL

1. Windows pre-reqs

   ```powershell
   winget install -e --id Microsoft.VisualStudioCode
   ```

1. Get a fresh new WSL machine up:

   > ⚠️ Warning: this removes Docker Desktop if you have it installed

   ```powershell
   $GIT_ROOT = git rev-parse --show-toplevel
   & "$GIT_ROOT\contrib\bootstrap-dev-env.ps1"
   ```

1. Clone the repo, and open VSCode in it:

   ```bash
   cd ~/

   git config --global user.name "Raki Rahman"
   git config --global user.email "mdrakiburrahman@gmail.com"
   git clone https://github.com/mdrakiburrahman/rakirahman.me.git

   cd rakirahman.me/
   code .
   ```

1. Run the bootstrapper script, that installs all tools idempotently:

   ```bash
   GIT_ROOT=$(git rev-parse --show-toplevel)
   chmod +x ${GIT_ROOT}/contrib/bootstrap-dev-env.sh && ${GIT_ROOT}/contrib/bootstrap-dev-env.sh
   ```

1. Login into AI tooling:

   ```bash
   $HOME/.local/bin/copilot --yolo
   ```

   ```bash
   gh auth login
   ```

1. Get the website up at `localhost:8000`:

   ```bash
   source ~/.bashrc
   gatsby develop
   ```

## Optimizing images

Large, high-resolution screenshots make `gatsby develop` crawl, because
`gatsby-plugin-sharp` re-processes every multi-megabyte image on each build. The
bootstrapper installs the [`sharp`](https://github.com/lovell/sharp) CLI, and
[`scripts/optimize-images.sh`](../scripts/optimize-images.sh) uses it to downscale
oversized images and re-encode them with aggressive compression, in-place. The
original is only overwritten when the result is actually smaller, so the script is
safe to re-run (idempotent).

Run it whenever you add new images:

```bash
# Optimize every image under content/, src/ and static/
./scripts/optimize-images.sh "*"

# Optimize a single new image
./scripts/optimize-images.sh content/my-new-post/images/screenshot.png

# Optimize a whole folder of new images (recursive)
./scripts/optimize-images.sh content/my-new-post

# Optimize several specific paths at once
./scripts/optimize-images.sh content/foo/a.png static/b.jpg
```

Tunables (optional environment variables):

| Variable    | Default | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| `MAX_WIDTH` | `2000`  | Max output width in px; images are never upscaled. |
| `QUALITY`   | `80`    | Encoder quality (1-100).                           |

```bash
# e.g. keep images a bit larger / higher quality
MAX_WIDTH=2400 QUALITY=85 ./scripts/optimize-images.sh "*"
```
