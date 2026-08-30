import React from "react"
import ReactDOM from "react-dom"
import PropTypes from "prop-types"

const TRIGGER_ATTRIBUTE = "data-post-lightbox-trigger"

const largestSrcSetCandidate = image => {
  const srcSet = image.getAttribute("srcset")
  if (!srcSet) return null

  const candidates = srcSet
    .split(",")
    .map(candidate => {
      const [src, descriptor = "0w"] = candidate.trim().split(/\s+/)
      return {
        src,
        size: Number.parseFloat(descriptor),
      }
    })
    .filter(candidate => candidate.src && Number.isFinite(candidate.size))
    .sort((left, right) => right.size - left.size)

  return candidates.length ? candidates[0].src : null
}

const imageDetails = image => {
  const responsiveLink = image.closest("a.gatsby-resp-image-link")

  return {
    src:
      (responsiveLink && responsiveLink.href) ||
      largestSrcSetCandidate(image) ||
      image.currentSrc ||
      image.src,
    alt: image.alt || "",
  }
}

const PostImageLightbox = ({ children }) => {
  const contentRef = React.useRef(null)
  const closeButtonRef = React.useRef(null)
  const previousFocusRef = React.useRef(null)
  const [activeImage, setActiveImage] = React.useState(null)

  const close = React.useCallback(() => setActiveImage(null), [])

  React.useEffect(() => {
    const content = contentRef.current
    if (!content) return undefined

    const prepareImages = () => {
      content.querySelectorAll("img").forEach(image => {
        const responsiveLink = image.closest("a.gatsby-resp-image-link")
        const interactiveAncestor = image.closest("a, button")
        const trigger =
          responsiveLink || (!interactiveAncestor ? image : undefined)

        if (!trigger) return

        trigger.setAttribute(TRIGGER_ATTRIBUTE, "")
        trigger.setAttribute("aria-haspopup", "dialog")
        trigger.setAttribute(
          "aria-label",
          image.alt ? `Expand image: ${image.alt}` : "Expand image"
        )
        trigger.setAttribute("title", "Click to expand")

        if (trigger === image) {
          trigger.setAttribute("role", "button")
          trigger.setAttribute("tabindex", "0")
        }
      })
    }

    prepareImages()
    const observer = new MutationObserver(prepareImages)
    observer.observe(content, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [children])

  React.useEffect(() => {
    if (!activeImage) return undefined

    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    if (closeButtonRef.current) closeButtonRef.current.focus()

    const handleKeyDown = event => {
      if (event.key === "Escape") close()
      if (event.key === "Tab") {
        event.preventDefault()
        if (closeButtonRef.current) closeButtonRef.current.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocusRef.current) previousFocusRef.current.focus()
    }
  }, [activeImage, close])

  const openFromTarget = target => {
    if (!target || typeof target.closest !== "function") return false

    const trigger = target.closest(`[${TRIGGER_ATTRIBUTE}]`)
    if (!trigger || !contentRef.current.contains(trigger)) return false

    const image = trigger.matches("img")
      ? trigger
      : trigger.querySelector("img")
    if (!image) return false

    previousFocusRef.current = trigger
    setActiveImage(imageDetails(image))
    return true
  }

  const handleClick = event => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return
    }
    if (!openFromTarget(event.target)) return

    event.preventDefault()
  }

  const handleKeyDown = event => {
    if (event.key !== "Enter" && event.key !== " ") return
    if (!openFromTarget(event.target)) return

    event.preventDefault()
  }

  const lightbox =
    activeImage && typeof document !== "undefined"
      ? ReactDOM.createPortal(
          <div
            className="post-image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={activeImage.alt || "Expanded image"}
            onClick={event => {
              if (event.target === event.currentTarget) close()
            }}
          >
            <button
              ref={closeButtonRef}
              className="post-image-lightbox-close"
              type="button"
              aria-label="Close expanded image"
              onClick={close}
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <figure className="post-image-lightbox-content">
              <img src={activeImage.src} alt={activeImage.alt} />
              {activeImage.alt && <figcaption>{activeImage.alt}</figcaption>}
            </figure>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <div
        ref={contentRef}
        className="post-image-content"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
      {lightbox}
    </>
  )
}

PostImageLightbox.propTypes = {
  children: PropTypes.node.isRequired,
}

export default PostImageLightbox
