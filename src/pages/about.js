import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { ExtLink } from "../components/atoms"
import Contact from "../components/contact"

const About = _ => {
  return (
    <Layout activePage="about">
      <SEO title="About" />
      <div className="container">
        <article className="prose">
          <h2>
            Hi{" "}
            <span role="img" aria-label="Wave">
              👋🏼
            </span>{" "}
            - I'm Raki Rahman
          </h2>
          <p>
            I'm a <strong>Data & AI</strong> Cloud Solutions Architect at{" "}
            <ExtLink link="https://www.microsoft.com/en-ca">
              <strong>Microsoft</strong>
            </ExtLink>{" "}
            - currently based out of Toronto, Canada.
          </p>
          <p>
            {" "}
            After graduating with Honours Distinction from University of
            Toronto's rigorous{" "}
            <ExtLink link="https://engsci.utoronto.ca/program/what-is-engsci/">
              <strong>EngSci</strong>
            </ExtLink>{" "}
            program as an <strong>Aerospace Engineer</strong>, I've worked at
            leading Technology Consulting firms in driving Azure Cloud
            Transformations across some of the largest Enterprise Clients in
            North America.
          </p>
          <h2>Why Data?</h2>
          <p>I've been working with Computers for as long as I can remember.</p>
          <p>
            Since I was 5 years old, I grew up building and fixing computers as
            a hobby. As I learned to code, this hobby developed into a deep,
            self-taught expertise of how computer hardware interacts with the
            hypervisor layer to solve real-life problems. Coupled with the
            practically infinite computing power of the Cloud for processing Big
            Data, I realized the frontier of growth in this field is endless.
            Applied correctly, we have the opportunity here to completely shape
            the world for the better.
          </p>
          <p>
            Plus I get to build a pretty entertaining career out of it too{" "}
            <span role="img" aria-label="Laugh">
              😄
            </span>
            .
          </p>
          <h2>Why make this blog?</h2>
          <p>
            Nothing gives me more joy than taking a seemingly{" "}
            <em>"difficult"</em> concept or problem and breaking it down to form
            a simple, elegant solution.
          </p>
          <p>
            I immensely enjoyed writing a few technical blog posts on LinkedIn,
            before quickly realizing the platform is pretty limiting as far as
            how creative you can get with presenting your content. I briefly
            tried WordPress too, and found the engine to be way too clunky (and
            expensive to host).
          </p>
          <p>
            To follow the pros: I decided to learn the{" "}
            <ExtLink link="https://www.javascript.com/">Javascript</ExtLink>{" "}
            framework - primarily{" "}
            <ExtLink link="https://reactjs.org/">React</ExtLink>, and{" "}
            <ExtLink link="https://graphql.org/">GraphQL</ExtLink> - and make
            this blog as a fun side project.
          </p>
          <p>
            So basically, this blog is a channel for me to keep my coding skills
            from getting rusty, while also giving back to the Data community!
          </p>
        </article>
      </div>
      <Contact />
    </Layout>
  )
}

export default About
