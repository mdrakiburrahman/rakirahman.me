# [rakirahman.me](https://www.rakirahman.me/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

![build](https://github.com/mdrakiburrahman/gatsby-blog/workflows/Deploy%20Website%20to%20Azure%20Storage%20Account%20and%20Purge%20CDN/badge.svg)

My personal blog running on Gatsby.

## Tech Stack

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)
- [Gatsby](https://www.gatsbyjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Storybook](https://storybook.js.org/)

## How to use, on a windows machine

> There's a Linux devcontainer in this repo, it's really slow with real-time updates from filesystem, windows direct development is much smoother.

1. Clone this repository.
2. Install nodejs **14.2.0** (yes, I'm in dependency hell and don't want to upgrade) via choco:

   ```powershell
    choco install nodejs.install --version=14.2.0 -y --force

    node --version
    # v14.2.0
   ```

3. Install Gatsby with `npm install -g gatsby-cli@2.12.21`.
4. `cd` into the root directory of the cloned repository and run `npm install` to install all site dependencies - this takes a few minutes grabbing all the packages in `yarn.lock`.
5. Run `gatsby develop` to build and start a local development server.
6. View the site at `localhost:8000`, with graphql endpoint at `localhost:8000/___graphql`
7. To view a production version of the site, run: `gatsby clean; gatsby build; gatsby serve` and view at `localhost:9000`


## How to use, on a Linux machine

1. Get a fresh new WSL machine up:

   ```powershell
   # Delete old WSL
   wsl --unregister Ubuntu-24.04

   # Create new WSL
   wsl --install -d Ubuntu-24.04
   ```

2. Open VS Code in the WSL:

   ```powershell
   code .
   ```

3. Clone the repo:

   ```bash
   cd ~/
   git clone https://github.com/mdrakiburrahman/rakirahman.me.git
   cd rakirahman.me/
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

4. Create a new branch, if required:

   ```bash
   git checkout -c dev/mdrrahman/branch-name
   ```

5. Run the bootstrapper script, that installs all tools idempotently:

   ```bash
   GIT_ROOT=$(git rev-parse --show-toplevel)
   chmod +x ${GIT_ROOT}/.scripts/bootstrap-dev-env.sh && ${GIT_ROOT}/.scripts/bootstrap-dev-env.sh
   ```

6. Get the website up at `localhost:8000`:

   ```bash
   gatsby develop
   ```

## CI/CD

Pushing code into this repository triggers two GitHub Actions:

1. `Purge Azure CDN`: which clears the Azure CDN cached content via purging
2. `Deploy Website to Azure Storage Account`: which builds the static site with `gatsby build`, and uploads content to an Azure Storage Account - where the site is being hosted.

## License

This project is open source and available under the [MIT License](LICENSE)
