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
            I'm a <strong>Software Engineer</strong> at Microsoft, building{" "}
            <ExtLink link="https://blog.fabric.microsoft.com/en-us/blog/sql-telemetry-intelligence-how-we-built-a-petabyte-scale-data-platform-with-fabric?ft=All">
              <strong>SQL Server Telemetry & Intelligence</strong>
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
            program as an <strong>Aerospace Engineer</strong> in 2016, I started
            my career as a <strong>Software Engineer</strong> building{" "}
            <ExtLink link="https://en.wikipedia.org/wiki/Numerical_control">
              <strong>CNC</strong>
            </ExtLink>{" "}
            and{" "}
            <ExtLink link="https://en.wikipedia.org/wiki/Enterprise_resource_planning">
              <strong>ERP</strong>
            </ExtLink>{" "}
            Software for a Robotics Manufacturing Firm. From there, I worked at
            leading Technology Consulting firms{" "}
            <ExtLink link="https://www.accenture.com/ca-en">[1]</ExtLink>{" "}
            <ExtLink link="https://www.slalom.com/">[2]</ExtLink> in driving
            Cloud, DevOps and Data Platform Transformations across some of the
            largest Enterprise Clients in North America. I then dove into{" "}
            <strong>Data Engineering and Machine Learning</strong> for a couple
            of years, all of which intensified a few notches after I joined
            Microsoft's Customer Success Unit as a{" "}
            <strong>Cloud Solution Architect</strong> in 2020.
          </p>
          <p>
            As of 2022, I'm back again to my Software Engineering roots, this
            time, extending Azure's Control Plane to Kubernetes to host robust{" "}
            <strong>Database Engines in Hybrid Clouds</strong>.
          </p>
          <h2>Why Data?</h2>
          <p>I've been working with Computers for as long as I can remember.</p>
          <p>
            Since I was 5 years old, I grew up building and fixing computers as
            a hobby. As I learned to code, this hobby developed into a deep,
            self-taught expertise of how computer hardware interacts with the
            hypervisor layer to solve real-life problems. Coupled with the
            practically infinite applications of technology and data, I realized
            the frontier of growth in this field is endless. Applied correctly,
            we have the opportunity here to completely shape the world for the
            better.
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
            So basically, this blog is a channel for me to have some fun, while
            also giving back to the Data community!
          </p>
        </article>
      </div>
      <Contact />
    </Layout>
  )
}

export default About
