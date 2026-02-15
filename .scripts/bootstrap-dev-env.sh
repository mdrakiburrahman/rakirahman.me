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
export NODE_VERSION=14.2.0
export NVM_VERSION=v0.39.5

echo ""
echo "┌───────────────────────────────┐"
echo "│ Installing VS Code extensions │"
echo "└───────────────────────────────┘"
echo ""

code --install-extension github.copilot
code --install-extension eamodio.gitlens

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

command -v copilot &>/dev/null || { curl -fsSL https://gh.io/copilot-install | bash; }

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

echo "copilot version: " $(copilot --version)
echo "nvm version: " $(nvm --version)
echo "node version: " $(node --version)
echo "npm version: " $(npm --version)
echo "gatsby version: " $(gatsby --version)
