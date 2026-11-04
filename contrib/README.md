# Contributing

## How to use, on a Windows machine by installing WSL

1. Windows pre-reqs

   ```powershell
   winget install -e --id Microsoft.VisualStudioCode
   ```

1. From an **elevated PowerShell 7** prompt in the checkout, install [Task](https://taskfile.dev)
   and run [`bootstrap-dev-env.yaml`](bootstrap-dev-env.yaml):

   > ⚠️ This **deletes every WSL distribution** on the machine before recreating `Ubuntu-24.04`, and
   > removes Docker Desktop if you have it installed. Push any work inside WSL first.

   ```powershell
   winget install Task.Task
   $env:PATH = [Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'User')
   task --taskfile contrib/bootstrap-dev-env.yaml
   ```

   Without any prompts, this recreates WSL on the drive with the most free space and clones your
   current branch into `/workspaces/rakirahman.me` with this checkout's git identity. It then runs
   [`bootstrap-dev-env.sh`](bootstrap-dev-env.sh), which installs all tools idempotently and builds
   the site, then opens the repo in VS Code connected to WSL. After a restart, run
   `task --taskfile contrib/bootstrap-dev-env.yaml up` instead; it keeps WSL and reopens VS Code.

1. Install the MDX extension from VS Code's WSL terminal (optional):

   ```bash
   code --install-extension unifiedjs.vscode-mdx
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
   cd /workspaces/rakirahman.me
   gatsby develop --verbose
   ```

   Wait for `You can now view rakirahman.me in the browser` before opening the
   site. Run `npm run clean` only after changing Gatsby configuration or when
   explicitly troubleshooting stale build state; it forces a full cold rebuild.
