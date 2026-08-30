#!/bin/bash
#
#
#       Sets up a dev env with all pre-reqs. This script is idempotent, it will
#       only attempt to install dependencies, if not exists.   
#
# ---------------------------------------------------------------------------------------
#

set -e
set -m

export GATSBY_VERSION=2.12.21
export SHARP_CLI_VERSION=2.1.1
export NODE_VERSION=14.2.0
export NVM_VERSION=v0.39.5

echo ""
echo "┌───────────────────────────────┐"
echo "│ Installing VS Code extensions │"
echo "└───────────────────────────────┘"
echo ""

code --install-extension unifiedjs.vscode-mdx

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
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
if ! command -v nvm &> /dev/null; then
    echo "nvm not found, installing..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh 2>&1 | bash
    # Load nvm again after install
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
else
    echo "nvm already installed"
fi

echo ""
echo "┌─────────────────┐"
echo "│ Installing Node │"
echo "└─────────────────┘"
echo ""

nvm install $NODE_VERSION

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

if ! command -v duckdb &> /dev/null; then
    echo "duckdb not found - installing..."
    curl https://install.duckdb.org | sh
    export PATH='/home/boor/.duckdb/cli/latest':$PATH
fi

curl -fsSL https://gh.io/copilot-install | bash;
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
	&& sudo mkdir -p -m 755 /etc/apt/keyrings \
	&& out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
	&& cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
	&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
	&& sudo mkdir -p -m 755 /etc/apt/sources.list.d \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
	&& sudo apt update \
	&& sudo apt install gh -y

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

npm install

echo ""
echo "┌──────────┐"
echo "│ Versions │"
echo "└──────────┘"
echo ""

echo "copilot version: " $(${HOME}/.local/bin/copilot --version)
echo "gh version: " $(gh --version)echo "nvm version: " $(nvm --version)
echo "node version: " $(node --version)
echo "npm version: " $(npm --version)
echo "gatsby version: " $(gatsby --version)
echo "sharp-cli version: " $(sharp --version)
echo "uv version: " $(uv --version)
