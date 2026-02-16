import React from "react"

const CenteredSearch = ({ allPosts }) => {
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const inputId = "centered-search-input"
  const dropdownRef = React.useRef(null)

  // Filter posts based on search query - search title, description, and body
  const filteredPosts = React.useMemo(() => {
    if (!query || query.trim() === "") return []
    
    const searchTerm = query.toLowerCase()
    
    return allPosts.map(post => {
      const titleMatch = post.title.toLowerCase().includes(searchTerm)
      const descriptionMatch = post.description?.toLowerCase().includes(searchTerm) || false
      const bodyMatch = post.body?.toLowerCase().includes(searchTerm) || false
      const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) || false
      
      if (!titleMatch && !descriptionMatch && !bodyMatch && !tagsMatch) {
        return null
      }
      
      // Find matching excerpt from body
      let bodyExcerpt = ""
      if (bodyMatch && post.body) {
        const bodyLower = post.body.toLowerCase()
        const index = bodyLower.indexOf(searchTerm)
        const start = Math.max(0, index - 80)
        const end = Math.min(post.body.length, index + searchTerm.length + 80)
        bodyExcerpt = (start > 0 ? "..." : "") + post.body.substring(start, end) + (end < post.body.length ? "..." : "")
      }
      
      return {
        ...post,
        titleMatch,
        descriptionMatch,
        bodyMatch,
        bodyExcerpt,
      }
    }).filter(Boolean)
  }, [query, allPosts])

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const handleClear = () => {
    setQuery("")
    setIsOpen(false)
  }

  const highlightMatch = (text, query) => {
    if (!query || !text) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} style={{ backgroundColor: "var(--color-bg-accent)", color: "var(--color-text-on-accent)", padding: "0 2px" }}>{part}</mark> 
        : part
    )
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      <label htmlFor={inputId} className="sr-only">
        Search blog posts
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search articles by title, content, or tags..."
          className="w-full px-6 py-4 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            borderColor: "var(--color-bg-secondary)",
          }}
          aria-label="Search blog posts"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-accent transition-colors duration-150"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && filteredPosts.length > 0 && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            border: "2px solid var(--color-bg-secondary)",
          }}
        >
          <ul className="max-h-96 overflow-y-auto">
            {filteredPosts.map(post => (
              <li key={post.slug}>
                <a
                  href={post.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-4 hover:bg-secondary transition-colors duration-150 border-b"
                  style={{ borderColor: "var(--color-bg-secondary)" }}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="font-semibold text-lg mb-2" style={{ color: "var(--color-text-accent)" }}>
                    {highlightMatch(post.title, query)}
                  </div>
                  {post.bodyMatch && post.bodyExcerpt && (
                    <div className="text-sm mb-2" style={{ color: "var(--color-text-tertiary)" }}>
                      {highlightMatch(post.bodyExcerpt, query)}
                    </div>
                  )}
                  {post.descriptionMatch && post.description && (
                    <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {highlightMatch(post.description, query)}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
          {filteredPosts.length > 0 && (
            <div className="px-6 py-2 text-xs text-center" style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-tertiary)" }}>
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CenteredSearch