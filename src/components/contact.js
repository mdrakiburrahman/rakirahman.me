import React from "react"
import { Button } from "./atoms"

export const Contact = () => {
  return (
    <div className="mt-32 full-width-container bg-secondary">
      <div className="container max-w-screen-xl mx-auto pt-16 text-gray-900">
        <h1 className="text-3xl font-semibold text-center text-primary">
          Get in touch{" "}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h1>
        <p className="px-4 mt-4 text-center text-secondary">
          Feel free to email me about anything - I’ll reply as soon as I can!
        </p>
        <div className="mx-auto  pt-10 flex justify-center">
          <Button width="widest" link="mailto:mdrakiburrahman@gmail.com">
            <span className=" text-2xl font-semibold text-on-accent">
              Say hello
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Contact
