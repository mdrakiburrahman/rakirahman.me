/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

const React = require("react")

const themeBootstrap = `
  (function () {
    var theme = "dark"
    var storedTheme

    try {
      storedTheme = window.localStorage.getItem("color-theme")
    } catch (error) {
      window.console.warn("Unable to read the saved color theme", error)
    }

    if (storedTheme === "light" || storedTheme === "dark") {
      theme = storedTheme
    }

    document.documentElement.classList.remove(
      theme === "dark" ? "light" : "dark"
    )
    document.documentElement.classList.add(theme)
  })()
`

exports.onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    React.createElement("script", {
      key: "theme-bootstrap",
      dangerouslySetInnerHTML: { __html: themeBootstrap },
    }),
  ])
}
