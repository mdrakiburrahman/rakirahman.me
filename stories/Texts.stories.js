import React from "react"
import { withA11y } from "@storybook/addon-a11y"
import { Heading, Paragraph, Strong, ExtLink, QuoteBlock } from "../src/components/atoms"

export default {
  title: "Texts",
  decorators: [withA11y],
}

export const TextHeading = _ => <Heading>Heading</Heading>
export const TextParagraph = _ => (
  <Paragraph>
    Dolor nisi incididunt Lorem tempor pariatur esse ut ipsum. Veniam nisi ex
    Lorem proident pariatur nisi mollit amet. Lorem est ipsum dolore dolor
    cillum.
  </Paragraph>
)
export const TextStrong = _ => <Strong>This text is strong!</Strong>
export const TextLink = _ => <ExtLink link="#">This is an inline link</ExtLink>
export const TextQuoteBlock = _ => (
  <QuoteBlock
    author="Ben Treynor Sloss"
    source="Site Reliability Engineering: How Google Runs Production Systems"
  >
    Hope is not a strategy. If a human operator needs to touch your system
    during normal operations, you have a bug. The definition of insanity is
    doing the same thing over and over again and expecting a different result.
  </QuoteBlock>
)
