module.exports = {
  siteMetadata: {
    title: `Raki Rahman`,
    description: `Big Data & AI`,
    author: `Raki Rahman`,
    siteUrl:
      process.env.DEV_ENV === 1
        ? `http://localhost:8000`
        : `https://www.rakirahman.me`,
    image: `/images/og-card.png`,
  },
  plugins: [
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: "UA-180300326-1",
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/assets/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content`,
      },
    },
    "gatsby-image",
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Raki Rahman`,
        short_name: `Raki Rahman`,
        start_url: `/`,
        background_color: `#2d3748`,
        theme_color: `#81E6D9`,
        display: `minimal-ui`,
        icon: `src/assets/images/logo-512x512.png`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-postcss`,
    `gatsby-plugin-sitemap`,
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        host: "https://www.rakirahman.me",
        sitemap: "https://www.rakirahman.me/sitemap.xml",
        policy: [{ userAgent: "*", allow: "/" }],
        env: {
          development: {
            policy: [{ userAgent: "*", disallow: ["/"] }],
          },
          production: {
            policy: [{ userAgent: "*", allow: "/" }],
          },
        },
      },
    },
    {
      resolve: `gatsby-plugin-env-variables`,
      options: {
        whitelist: [
          "GATSBY_GOOGLE_SITE_VERIFICATION, GOOGLE_ANALYTICS_TRACKING_ID, DEV_ENV",
        ],
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.mdx`, `.md`],
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1920,
              showCaptions: true,
              quality: 100,
            },
          },
          {
            resolve: "gatsby-remark-embed-youtube",
            options: {
              width: 800,
              height: 400,
            },
          },
          {
            resolve: "gatsby-remark-autolink-headers",
            options: {
              elements: [`h2`, `h3`],
            },
          },
          {
            resolve: "gatsby-remark-prismjs",
            options: {},
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-feed-mdx`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                author
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,

        // Mostly copied from default in gatsby-plugin-feed source code
        // but adding a custom namespace
        // Credits: https://github.com/gatsbyjs/gatsby/issues/10308
        setup: ({
          query: {
            site: { siteMetadata },
          },
          ...rest
        }) => {
          return {
            ...siteMetadata,
            ...rest,
            custom_namespaces: {
              media: "http://search.yahoo.com/mrss/",
            },
          }
        },

        feeds: [
          {
            serialize: ({ query: { site, allMdx } }) => {
              const {
                siteMetadata: { siteUrl },
              } = site

              return allMdx.edges.map(edge => {
                const {
                  node: {
                    frontmatter: { title, date, description, featuredImage },
                    fields: { slug },
                    html,
                  },
                } = edge

                // Options available here:
                // https://www.npmjs.com/package/rss#itemoptions
                // Credits: https://github.com/dylang/node-rss/issues/19

                return Object.assign({}, edge.node.frontmatter, {
                  title: title,
                  description: description,
                  date: date,
                  url: siteUrl + slug,
                  guid: siteUrl + slug,
                  enclosure: featuredImage && {
                    url: siteUrl + featuredImage.publicURL,
                  },
                  custom_elements: [
                    { "content:encoded": html },
                    {
                      "media:content": [
                        {
                          _attr: {
                            medium: "image",
                            url: siteUrl + featuredImage.publicURL,
                          },
                        },
                        {
                          "media:thumbnail": {
                            _attr: {
                              url: siteUrl + featuredImage.publicURL,
                            },
                          },
                        },
                      ],
                    },
                  ],
                })
              })
            },
            query: `
              {
                allMdx(
                  filter: { frontmatter: { published: { eq: true } } }
                  sort: { order: DESC, fields: [frontmatter___date] },
                ) {
                  edges {
                    node {
                      html
                      fields { 
                        slug
                      }
                      frontmatter {
                        title
                        date
                        description
                        featuredImage {
                          publicURL
                        }
                      }
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: "Raki Rahman's Blog",
            // optional configuration to insert feed reference in pages:
            // if `string` is used, it will be used to create RegExp and then test if pathname of
            // current page satisfied this regular expression;
            // if not provided or `undefined`, all pages will have feed reference inserted
            match: "^/",
          },
        ],
      },
    },
    "gatsby-remark-autolink-headers",
  ],
}
