import React from "react"
import { TagBadge } from "./atoms"

const TagFilterBar = ({ tags, selectedTag, onTagToggle, onClearAll }) => {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="mt-12 mb-6">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <TagBadge
            key={tag.name}
            name={tag.name}
            count={tag.count}
            selected={selectedTag === tag.name}
            clickable={true}
            onClick={() => onTagToggle(tag.name)}
          />
        ))}
        {selectedTag && (
          <button
            className="px-3 py-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 whitespace-nowrap"
            onClick={onClearAll}
            type="button"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}

export default TagFilterBar
