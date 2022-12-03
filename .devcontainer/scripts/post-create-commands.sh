#!/bin/bash -xe

# Fix workspace permissions
sudo chown -R vscode:sudo /workspaces

# Create directory for node version manager
sudo mkdir -p /usr/local/share/nvm
sudo chown -R vscode:sudo /usr/local/share/nvm

# Node Packages
npm install -g gatsby-cli@2.12.21
npm install