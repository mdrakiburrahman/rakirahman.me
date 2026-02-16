import React from "react"

const SearchBar = ({ allPosts, placeholder = "Search blog posts..." }) => {
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const inputId = "search-bar-input"
  const dropdownRef = React.useRef(null)

  // Filter posts based on search query
  const filteredPosts = React.useMemo(() => {
    if (!query || query.trim() === "") return []
    
    const searchTerm = query.toLowerCase()
    return allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(searchTerm)
      const descriptionMatch = post.description?.toLowerCase().includes(searchTerm) || false
      const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) || false
      
      return titleMatch || descriptionMatch || tagsMatch
    }).slice(0, 5) // Limit to 5 results
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
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-accent text-on-accent">{part}</mark> 
        : part
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
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
          placeholder={placeholder}
          className="w-64 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all duration-150"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
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
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-accent transition-colors duration-150"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
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
          className="absolute top-full mt-1 w-full max-w-md rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-secondary)",
          }}
        >
          <ul className="max-h-96 overflow-y-auto">
            {filteredPosts.map(post => (
              <li key={post.slug}>
                <a
                  href={post.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 hover:bg-secondary transition-colors duration-150"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="text-sm font-semibold text-accent mb-1">
                    {highlightMatch(post.title, query)}
                  </div>
                  <div className="text-xs text-tertiary">
                    {post.description && highlightMatch(post.description.substring(0, 100), query)}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchBar
