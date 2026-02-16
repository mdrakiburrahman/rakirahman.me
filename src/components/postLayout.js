import React from "react"
import { graphql } from "gatsby"
import { MDXProvider } from "@mdx-js/react"
import { MDXRenderer } from "gatsby-plugin-mdx"
import { Link } from "gatsby"
import Layout from "./layout"
import SEO from "./seo"
import { BlogTitle, BlogTitleInfo, ExtLink, TagBadge } from "./atoms"
import Contact from "../components/contact"
import TOC from "./toc"

const shortcodes = {
  ExtLink,
  Link,
}

const PostLayout = ({ data: { mdx, ogImage, allMdx } }) => {
  const allPosts = allMdx.edges.map(({ node }) => ({
    slug: node.fields.slug,
    title: node.frontmatter.title,
    description: node.frontmatter.description,
    tags: node.frontmatter.tags || [],
    excerpt: node.excerpt,
    body: node.rawBody,
  }))

  return (
    <Layout activePage="blog" allPosts={allPosts}>
      <SEO
        blog
        title={mdx.frontmatter.title}
        description={mdx.frontmatter.description}
        ogImage={ogImage && ogImage.childImageSharp.fixed.src}
        ogUrl={mdx.fields.slug}
      />
      <div className="flex justify-between mt-12 mb-12 relative">
        <article className="prose sm:prose md:prose-lg min-w-0 max-w-none tracking-normal">
          <div className="">
            {mdx.frontmatter.tags && mdx.frontmatter.tags.length > 0 && (
              <div className="tag-scroll-container mb-5">
                {mdx.frontmatter.tags.map(tag => (
                  <TagBadge
                    key={tag}
                    name={tag}
                    selected={false}
                    clickable={false}
                  />
                ))}
              </div>
            )}
            <BlogTitleInfo
              date={mdx.frontmatter.date}
              datetime={mdx.frontmatter.datetime}
              timeToRead={mdx.timeToRead}
            />
            <BlogTitle>{mdx.frontmatter.title}</BlogTitle>
          </div>
          <MDXProvider components={shortcodes}>
            <MDXRenderer>{mdx.body}</MDXRenderer>
          </MDXProvider>
        </article>
        {mdx.tableOfContents && mdx.frontmatter.toc === true && (
          <aside className="sticky hidden lg:block max-w-xs ml-6 mt-8 h-screen">
            <TOC items={mdx.tableOfContents.items} />
          </aside>
        )}
      </div>
      <Contact />
    </Layout>
  )
}

export const pageQuery = graphql`
  query blogPostQuery($id: String, $ogImageSlug: String) {
    mdx(id: { eq: $id }) {
      id
      body
      frontmatter {
        title
        date(formatString: "MMMM Do YYYY")
        datetime: date
        description
        toc
        tags
      }
      fields {
        slug
      }
      excerpt(pruneLength: 140)
      tableOfContents
      timeToRead
    }
    allMdx(
      sort: { fields: frontmatter___date, order: DESC }
      filter: { frontmatter: { published: { eq: true } } }
    ) {
      edges {
        node {
          id
          frontmatter {
            title
            description
            tags
          }
          fields {
            slug
          }
          excerpt(pruneLength: 300)
          rawBody
        }
      }
    }
    ogImage: file(relativePath: { eq: $ogImageSlug }) {
      childImageSharp {
        fixed(width: 1280) {
          src
        }
      }
    }
  }
`

export default PostLayout
