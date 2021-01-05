import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"
import PostList from "../components/postList"
import { Heading } from "../components/atoms"

import { Blob } from "../components/atoms"
import Contact from "../components/contact"
import Image from "../components/image"

const IndexPage = () => {
  return (
    <Layout activePage="/">
      <SEO />
      <div className="mt-12 flex flex-col-reverse lg:flex-row items-center lg:justify-between lg:space-x-6">
        <h1 className="mt-12 lg:mt-0 max-w-3xl text-3xl sm:text-4xl text-primary font-bold sm:text-left md:text-center lg:text-left">
          Hi, I’m Raki.
          <br className="mb-6 lg:hidden" /> I build Data & AI Solutions on
          <span className="text-accent"> Azure</span>.
        </h1>
        <div className="relative">
          <Blob />
          <div className="absolute w-full h-full top-0 flex items-center justify-center">
            <div className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full overflow-hidden">
              <Image />
            </div>
          </div>
        </div>
      </div>
      <PostList showHeading />
      <Contact />
    </Layout>
  )
}

export default IndexPage
