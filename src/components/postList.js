import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import { Link } from "gatsby"
import TagFilterBar from "./tagFilterBar"
import { TagBadge } from "./atoms"

const Post = ({ post }) => {
  return (
    <li className="py-3">
      <Link to={post.slug}>
        <div className="-mx-5 -my-3 px-5 py-3 group hover:bg-secondary">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
            <div>
              <h3 className="text-xl font-semibold group-hover:text-accent">
                {post.title}
              </h3>
              <h4 className="font-medium text-tertiary mt-1">{post.description}</h4>
            </div>
            <div className="mt-2 sm:mt-0 text-sm sm:text-base text-accent sm:text-tertiary">
              {post.date}
            </div>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="tag-scroll-container mt-2">
              {post.tags.map(tag => (
                <TagBadge
                  key={tag}
                  name={tag}
                  selected={false}
                  clickable={false}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}

const PostList = ({ showHeading }) => {
  const [selectedTag, setSelectedTag] = React.useState(null)

  const data = useStaticQuery(graphql`
    query PageQuery {
      allMdx(
        sort: { fields: frontmatter___date, order: DESC }
        filter: { frontmatter: { published: { eq: true } } }
      ) {
        edges {
          node {
            id
            frontmatter {
              title
              date(formatString: "MMMM Do YYYY")
              published
              tags
              description
            }
            fields {
              slug
            }
          }
        }
      }
    }
  `)

  // Calculate unique tags with counts, sorted by count descending
  const uniqueTags = React.useMemo(() => {
    const tagCounts = {}
    
    data.allMdx.edges.forEach(({ node }) => {
      const tags = node.frontmatter.tags || []
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  // Filter posts based on selected tag (single select)
  const filteredPosts = React.useMemo(() => {
    const allPosts = data.allMdx.edges.map(({ node }) => ({
      id: node.id,
      slug: node.fields.slug,
      title: node.frontmatter.title,
      date: node.frontmatter.date,
      description: node.frontmatter.description,
      tags: node.frontmatter.tags || [],
    }))

    if (!selectedTag) {
      return allPosts
    }

    return allPosts.filter(post => 
      post.tags.includes(selectedTag)
    )
  }, [data, selectedTag])

  // Handler for toggling tag selection (single select)
  const handleTagToggle = (tagName) => {
    setSelectedTag(prev => prev === tagName ? null : tagName)
  }

  // Handler for clearing selected tag
  const handleClearAll = () => {
    setSelectedTag(null)
  }

  return (
    <section className="">
      {showHeading && (
        <h2 className="mt-64 text-xl font-bold text-accent tracking-widestest">
          LATEST ARTICLES
          <h4 className="font-medium text-sm text-tertiary tracking-tight">
            All opinions are my own and not those of my employer.
          </h4>
        </h2>
      )}
      {filteredPosts.length > 0 ? (
        <ul className="mt-3 divide-y divide-subtle">
          {filteredPosts.map(post => (
            <Post key={post.id} post={post} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-base text-tertiary">
          No posts found. Try adjusting your filter.
        </p>
      )}
      <TagFilterBar
        tags={uniqueTags}
        selectedTag={selectedTag}
        onTagToggle={handleTagToggle}
        onClearAll={handleClearAll}
      />
    </section>
  )
}

export default PostList

