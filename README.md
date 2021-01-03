# [rakirahman.me](https://rakirahman.me)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

![build](https://github.com/mdrakiburrahman/gatsby-blog/workflows/Deploy%20Website%20to%20Azure%20Storage%20Account/badge.svg)

![deploy](https://github.com/mdrakiburrahman/gatsby-blog/workflows/Purge%20Azure%20CDN/badge.svg)

My personal blog running on Gatsby.

## Tech Stack

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)
- [Gatsby](https://www.gatsbyjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Storybook](https://storybook.js.org/)

## How to use

1. Clone this repository.
2. Install Gatsby with `npm install -g gatsby-cli`.
3. `cd` into the root directory of the cloned repository and run `npm install` to install all site dependencies.
4. Run `gatsby develop` to build and start a local development server.
5. View the site at `localhost:8000`, with graphql endpoint at `localhost:8000/___graphql`
6. To view a production version of the site, run: `gatsby clean; gatsby build; gatsby serve` and view at `localhost:9000`


## CI/CD

Pushing code into this repository triggers two GitHub Actions:

1. `Purge Azure CDN`: which clears the Azure CDN cached content via purging
2. `Deploy Website to Azure Storage Account`: which builds the static site with `gatsby build`, and uploads content to an Azure Storage Account - where the site is being hosted.

## License

This project is open source and available under the [MIT License](LICENSE)
