import { Link } from "gatsby"
import React from "react"
import ThemeToggle from "./themeToggle"
import { NavLink, BlobHeader } from "./atoms"

const Header = ({ activePage }) => (
  <header className="container m-auto px-5 sm:px-12 md:px-20 max-w-screen-xl h-32 overflow-hidden">
    <nav
      className="mt-auto h-full flex space-x-6 items-center justify-center md:justify-start text-sm"
      aria-label="Main Navigation"
    >
      <Link to="/" aria-label="Website logo, go back to homepage.">
        <svg
          aria-hidden="true"
          role="img"
          className="h-12 sm:h-10 w-12 sm:w-10 fill-current hover:text-accent transition duration-150"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 530 373"
        >
          <path d="M389.6,407.6C361.4,364.3,302.9,274,275.5,232c23.7,0.1,32.4,0.8,46-4.6 c67.2-26.7,47.1-126.9-23.9-126.9l-96,0v307h-61.5V41.7l157.5,0c117.4,0,170,150.7,73.8,224.6l9.4,14.5 c111.2-84.3,50-256.3-83.2-256.3l-177.7,0v383.1H99.2V3.6c20.3,0,196.5,0,198.3,0C453,3.6,519,203.8,392.1,298.1l49,75.5 L389.6,407.6z M160.8,62.5v324.2h20.2v-307l116.6,0c99.9,0,121.9,149.7,15.3,171.7L395.1,378l16.9-11.1l-69.6-107.2 c100.7-51.3,61.3-197.2-44.8-197.2l0,0L160.8,62.5z" />
        </svg>
      </Link>
      <span className="hidden sm:flex flex-grow items-center space-x-6">
        <NavLink to="/" title="Blog" selected={activePage === "/"}>
          Blog
        </NavLink>
        <NavLink to="/about" title="About" selected={activePage === "about"}>
          About
        </NavLink>
      </span>
      <ThemeToggle className="hidden sm:block hover:text-accent transition duration-150" />
    </nav>

    <div className="hidden sm:block">
      <div className="-mt-120 sm:-mt-120 ml-4">
        <BlobHeader />
      </div>
    </div>
  </header>
)

export default Header
