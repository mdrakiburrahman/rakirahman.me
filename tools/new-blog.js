const fs = require("fs")
const path = require("path")

const repositoryRoot = path.resolve(__dirname, "..")
const requiredFlags = ["title", "description", "tags", "toc"]
const supportedFlags = new Set(requiredFlags.map(flag => `--${flag}`))

const usage = `Usage:
  npm run new-blog -- \\
    --title "My Blog Post" \\
    --description "A concise summary" \\
    --tags "Azure,Gatsby" \\
    --toc true

Required flags:
  --title        Post title; used to derive the URL slug
  --description  Short post summary
  --tags         Comma-separated list containing at least one tag
  --toc          Whether to show the table of contents: true or false

The generated post uses today's date and starts with published: false.`

const hasOwn = (object, property) =>
  Object.prototype.hasOwnProperty.call(object, property)

const slugify = title =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const parseArgs = args => {
  const helpFlags = args.filter(arg => arg === "--help" || arg === "-h")

  if (helpFlags.length > 0) {
    if (args.length !== 1) {
      throw new Error("--help cannot be combined with other arguments")
    }

    return { help: true }
  }

  const values = {}

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]

    if (!flag.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${JSON.stringify(flag)}`)
    }

    if (!supportedFlags.has(flag)) {
      throw new Error(`Unknown flag: ${flag}`)
    }

    const name = flag.slice(2)

    if (hasOwn(values, name)) {
      throw new Error(`Duplicate flag: ${flag}`)
    }

    const value = args[index + 1]

    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}`)
    }

    values[name] = value
    index += 1
  }

  const missingFlags = requiredFlags.filter(flag => !hasOwn(values, flag))

  if (missingFlags.length > 0) {
    throw new Error(
      `Missing required flag${
        missingFlags.length === 1 ? "" : "s"
      }: ${missingFlags.map(flag => `--${flag}`).join(", ")}`
    )
  }

  const title = values.title.trim()
  const description = values.description.trim()

  if (title.length === 0) {
    throw new Error("--title must not be empty")
  }

  if (description.length === 0) {
    throw new Error("--description must not be empty")
  }

  const tags = values.tags.split(",").map(tag => tag.trim())

  if (tags.length === 0 || tags.some(tag => tag.length === 0)) {
    throw new Error(
      "--tags must be a comma-separated list containing no empty tags"
    )
  }

  if (values.toc !== "true" && values.toc !== "false") {
    throw new Error("--toc must be either true or false")
  }

  const slug = slugify(title)

  if (slug.length === 0) {
    throw new Error("--title must contain at least one ASCII letter or number")
  }

  return {
    help: false,
    title,
    description,
    tags,
    toc: values.toc === "true",
    slug,
  }
}

const formatLocalDate = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const serializeTags = tags =>
  `[${tags.map(tag => JSON.stringify(tag)).join(", ")}]`

const buildPost = metadata => {
  const ogImage = `og-${metadata.slug}.png`

  return `---
title: ${JSON.stringify(metadata.title)}
date: ${formatLocalDate(new Date())}
published: false
tags: ${serializeTags(metadata.tags)}
description: ${JSON.stringify(metadata.description)}
toc: ${metadata.toc}
seoImage: ${JSON.stringify(ogImage)}
featuredImage: "./featured-image.png"
---
`
}

const pathExists = async targetPath => {
  try {
    await fs.promises.lstat(targetPath)
    return true
  } catch (error) {
    if (error.code === "ENOENT") {
      return false
    }

    throw error
  }
}

const cleanupCreatedArtifacts = async artifacts => {
  const failures = []

  for (const artifact of artifacts.reverse()) {
    try {
      if (artifact.type === "file") {
        await fs.promises.unlink(artifact.path)
      } else {
        await fs.promises.rmdir(artifact.path)
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        failures.push(`${artifact.path}: ${error.message}`)
      }
    }
  }

  return failures
}

const createPost = async metadata => {
  const postDirectory = path.join(repositoryRoot, "content", metadata.slug)
  const imagesDirectory = path.join(postDirectory, "images")
  const indexFile = path.join(postDirectory, "index.mdx")
  const featuredImage = path.join(postDirectory, "featured-image.png")
  const placeholderImage = path.join(
    repositoryRoot,
    "src",
    "assets",
    "images",
    "og-tbd.png"
  )
  const ogImage = path.join(
    repositoryRoot,
    "src",
    "assets",
    "images",
    `og-${metadata.slug}.png`
  )

  const [postExists, ogImageExists] = await Promise.all([
    pathExists(postDirectory),
    pathExists(ogImage),
  ])
  const collisions = [
    postExists && postDirectory,
    ogImageExists && ogImage,
  ].filter(Boolean)

  if (collisions.length > 0) {
    const paths = collisions
      .map(targetPath => `  ${path.relative(repositoryRoot, targetPath)}`)
      .join("\n")

    throw new Error(`Refusing to overwrite existing path(s):\n${paths}`)
  }

  await fs.promises.access(placeholderImage, fs.constants.R_OK)

  const createdArtifacts = []

  try {
    await fs.promises.mkdir(postDirectory)
    createdArtifacts.push({ type: "directory", path: postDirectory })

    await fs.promises.mkdir(imagesDirectory)
    createdArtifacts.push({ type: "directory", path: imagesDirectory })

    createdArtifacts.push({ type: "file", path: indexFile })
    await fs.promises.writeFile(indexFile, buildPost(metadata), {
      encoding: "utf8",
      flag: "wx",
    })

    createdArtifacts.push({ type: "file", path: featuredImage })
    await fs.promises.copyFile(
      placeholderImage,
      featuredImage,
      fs.constants.COPYFILE_EXCL
    )

    await fs.promises.copyFile(
      placeholderImage,
      ogImage,
      fs.constants.COPYFILE_EXCL
    )
    createdArtifacts.push({ type: "file", path: ogImage })
  } catch (error) {
    const cleanupFailures = await cleanupCreatedArtifacts(createdArtifacts)
    const cleanupDetails =
      cleanupFailures.length === 0
        ? ""
        : `\nCleanup also failed:\n${cleanupFailures
            .map(failure => `  ${failure}`)
            .join("\n")}`

    throw new Error(
      `Could not create the post scaffold: ${error.message}${cleanupDetails}`
    )
  }

  return {
    postDirectory,
    imagesDirectory,
    indexFile,
    featuredImage,
    ogImage,
  }
}

const printSuccess = (metadata, paths) => {
  const displayPaths = [
    paths.indexFile,
    `${paths.imagesDirectory}${path.sep}`,
    paths.featuredImage,
    paths.ogImage,
  ].map(targetPath => path.relative(repositoryRoot, targetPath))

  console.log(`Created unpublished draft "${metadata.title}":`)
  displayPaths.forEach(targetPath => console.log(`  ${targetPath}`))
}

const main = async args => {
  const metadata = parseArgs(args)

  if (metadata.help) {
    console.log(usage)
    return
  }

  const paths = await createPost(metadata)
  printSuccess(metadata, paths)
}

main(process.argv.slice(2)).catch(error => {
  console.error(`Error: ${error.message}`)
  console.error("Run with --help to see the required arguments.")
  process.exitCode = 1
})
