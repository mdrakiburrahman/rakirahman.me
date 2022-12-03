# Grabs VS Code's devcontainer base image for Ubuntu 20.04
FROM mcr.microsoft.com/vscode/devcontainers/base:focal

# Copy library scripts to execute
COPY scripts/*.sh /tmp/scripts/

# Switch from root to non-root user
USER vscode
