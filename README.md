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

## How to use, on a Linux machine

See [doc](contrib/README.md).

## CI/CD

Pushing code into this repository triggers two GitHub Actions:

1. `Purge Azure CDN`: which clears the Azure CDN cached content via purging
2. `Deploy Website to Azure Storage Account`: which builds the static site with `gatsby build`, and uploads content to an Azure Storage Account - where the site is being hosted.

## License

This project is open source and available under the [MIT License](LICENSE)
