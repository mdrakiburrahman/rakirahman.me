#!/bin/bash
#
#
#       Sets up a dev env with all pre-reqs, then builds the site. This script is
#       idempotent, it will only attempt to install dependencies, if not exists.
#
# ---------------------------------------------------------------------------------------
#

set -eo pipefail

export GATSBY_VERSION=2.12.21
export SHARP_CLI_VERSION=2.1.1
export NODE_VERSION=14.2.0
export NVM_VERSION=v0.39.5

export DEBIAN_FRONTEND=noninteractive
export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "/mnt/c" | tr '\n' ':' | sed 's/:$//')

cd "$(dirname "$(readlink -f "$0")")/.."

echo ""
echo "┌───────────────────────────────┐"
echo "│ Installing VS Code extensions │"
echo "└───────────────────────────────┘"
echo ""

# Only VS Code's WSL terminal provides code; the one-shot Taskfile runs this before VS Code opens.
if command -v code &> /dev/null; then
    code --install-extension unifiedjs.vscode-mdx
fi

echo ""
echo "┌────────────────┐"
echo "│ Installing NVM │"
echo "└────────────────┘"
echo ""

# nvm doesn't show up without sourcing this script. This is done in bashrc,
# but does not stick in the subshell for scripts.
#
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
if ! command -v nvm &> /dev/null; then
    echo "nvm not found, installing..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash
    \. "$NVM_DIR/nvm.sh"
else
    echo "nvm already installed"
fi

echo ""
echo "┌─────────────────┐"
echo "│ Installing Node │"
echo "└─────────────────┘"
echo ""

nvm install $NODE_VERSION
nvm alias default $NODE_VERSION
nvm use $NODE_VERSION

npm config set user 0
npm config set unsafe-perm true

echo ""
echo "┌──────────────────────┐"
echo "│ Installing CLI tools │"
echo "└──────────────────────┘"
echo ""

if ! command -v gatsby &> /dev/null; then
    npm install -g gatsby-cli@$GATSBY_VERSION
fi

if ! command -v sharp &> /dev/null; then
    echo "sharp-cli not found, installing..."
    npm install -g sharp-cli@$SHARP_CLI_VERSION
else
    echo "sharp-cli already installed"
fi

export PATH="$HOME/.duckdb/cli/latest:$PATH"
if ! command -v duckdb &> /dev/null; then
    echo "duckdb not found - installing..."
    curl -fsSL https://install.duckdb.org | sh
    echo 'export PATH="$HOME/.duckdb/cli/latest:$PATH"' >> ~/.bashrc
fi

if [ ! -x "$HOME/.local/bin/copilot" ]; then
    curl -fsSL https://gh.io/copilot-install | bash
fi

if ! command -v gh &> /dev/null; then
    (type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
        && sudo mkdir -p -m 755 /etc/apt/keyrings \
        && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
        && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
        && sudo mkdir -p -m 755 /etc/apt/sources.list.d \
        && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
        && sudo apt update \
        && sudo apt install gh -y
fi

if ! command -v uv &> /dev/null; then
    echo "uv not found, installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.local/bin/env
else
    echo "uv already installed"
fi

echo ""
echo "┌──────────────────────────┐"
echo "│ Installing site packages │"
echo "└──────────────────────────┘"
echo ""

npm ci

echo ""
echo "┌───────────────────┐"
echo "│ Building the site │"
echo "└───────────────────┘"
echo ""

npm run build

echo ""
echo "┌──────────┐"
echo "│ Versions │"
echo "└──────────┘"
echo ""

echo "copilot version: " $(${HOME}/.local/bin/copilot --version)
echo "gh version: " $(gh --version)
echo "nvm version: " $(nvm --version)
echo "node version: " $(node --version)
echo "npm version: " $(npm --version)
echo "gatsby version: " $(gatsby --version)
echo "sharp-cli version: " $(sharp --version)
echo "duckdb version: " $(duckdb --version)
echo "uv version: " $(uv --version)
