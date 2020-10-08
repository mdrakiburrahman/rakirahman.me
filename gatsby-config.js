module.exports = {
  siteMetadata: {
    title: `Raki Rahman`,
    description: `Raki Rahman | Big Data & AI`,
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
        trackingId: process.env.GOOGLE_ANALYTICS_TRACKING_ID,
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
              maxWidth: 590,
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
    "gatsby-remark-autolink-headers",
  ],
}
