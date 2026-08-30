const fs = require("fs")
const os = require("os")
const path = require("path")
const { spawn, spawnSync } = require("child_process")

const repositoryRoot = path.resolve(__dirname, "..")
const searchDirectories = ["content", "src", "static"]
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"])

const usage = `Usage:
  npm run optimize-images -- "*" | <path> [<path>...]

Arguments:
  "*" or "all"  Optimize every image under content/, src/, and static/
  <path>        Optimize an image or all images below a directory

Optional environment variables:
  MAX_WIDTH     Maximum output width in pixels (default: 2000)
  QUALITY       Encoder quality from 1 to 100 (default: 80)`

const parseIntegerSetting = (name, defaultValue, maximum) => {
  const rawValue = process.env[name]
  const value =
    rawValue === undefined || rawValue === "" ? defaultValue : rawValue

  if (!/^\d+$/.test(String(value))) {
    throw new Error(`${name} must be a positive integer`)
  }

  const parsedValue = Number(value)

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1 ||
    (maximum !== undefined && parsedValue > maximum)
  ) {
    const range =
      maximum === undefined ? "a positive integer" : `between 1 and ${maximum}`
    throw new Error(`${name} must be ${range}`)
  }

  return parsedValue
}

const assertSharpAvailable = () => {
  const result = spawnSync("sharp", ["--version"], { stdio: "ignore" })

  if (result.error && result.error.code === "ENOENT") {
    throw new Error(
      "'sharp' CLI not found. Install it with ./contrib/bootstrap-dev-env.sh"
    )
  }

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error("'sharp' CLI is installed but could not be executed")
  }
}

const getPathType = async targetPath => {
  try {
    const stats = await fs.promises.stat(targetPath)

    if (stats.isDirectory()) {
      return "directory"
    }

    if (stats.isFile()) {
      return "file"
    }

    return "other"
  } catch (error) {
    if (error.code === "ENOENT") {
      return "missing"
    }

    throw error
  }
}

const collectImages = async (directory, files) => {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      await collectImages(entryPath, files)
    } else if (
      entry.isFile() &&
      imageExtensions.has(path.extname(entry.name).toLowerCase())
    ) {
      files.add(entryPath)
    }
  }
}

const resolveInputFiles = async args => {
  const files = new Set()

  if (args[0] === "*" || args[0] === "all") {
    for (const directory of searchDirectories) {
      const targetPath = path.join(repositoryRoot, directory)

      if ((await getPathType(targetPath)) === "directory") {
        await collectImages(targetPath, files)
      }
    }

    return [...files]
  }

  for (const inputPath of args) {
    const targetPath = path.resolve(repositoryRoot, inputPath)
    const pathType = await getPathType(targetPath)

    if (pathType === "directory") {
      await collectImages(targetPath, files)
    } else if (pathType === "file") {
      files.add(targetPath)
    } else {
      console.warn(
        `Warning: skipping '${inputPath}' because it is not a file or directory`
      )
    }
  }

  return [...files]
}

const runSharp = args =>
  new Promise((resolve, reject) => {
    const child = spawn("sharp", args, { stdio: "ignore" })

    child.once("error", reject)
    child.once("close", code => resolve(code === 0))
  })

const removeTemporaryDirectory = async directory => {
  let entries

  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === "ENOENT") {
      return
    }

    throw error
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      await removeTemporaryDirectory(entryPath)
    } else {
      await fs.promises.unlink(entryPath)
    }
  }

  await fs.promises.rmdir(directory)
}

const displayPath = filePath => {
  const relativePath = path.relative(repositoryRoot, filePath)

  if (!relativePath.startsWith(`..${path.sep}`) && relativePath !== "..") {
    return relativePath
  }

  return filePath
}

const humanizeBytes = bytes => {
  if (bytes < 1024) {
    return `${bytes}B`
  }

  const units = ["KiB", "MiB", "GiB", "TiB"]
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length
  )
  const value = bytes / 1024 ** exponent
  const precision = value >= 10 ? 0 : 1

  return `${value.toFixed(precision)}${units[exponent - 1]}`
}

const formatResult = (filePath, before, after) => {
  const name = displayPath(filePath).padEnd(60)
  const beforeSize = humanizeBytes(before).padStart(10)

  if (after >= before) {
    console.log(`Skipped   ${name} ${beforeSize} (already optimal)`)
    return
  }

  const afterSize = humanizeBytes(after).padStart(10)
  const percentage = Math.floor(((before - after) * 100) / before)
  console.log(
    `Optimized ${name} ${beforeSize} -> ${afterSize}  (-${percentage}%)`
  )
}

const optimizeImage = async (filePath, settings) => {
  const before = (await fs.promises.stat(filePath)).size
  const temporaryDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "optimize-images-")
  )

  try {
    const extension = path.extname(filePath).toLowerCase()
    const sharpArgs = [
      "-i",
      filePath,
      "-o",
      temporaryDirectory,
      "-q",
      String(settings.quality),
    ]

    if (extension === ".png") {
      sharpArgs.push("--palette")
    } else if (extension === ".jpg" || extension === ".jpeg") {
      sharpArgs.push("--mozjpeg")
    }

    sharpArgs.push("resize", String(settings.maxWidth), "--withoutEnlargement")

    if (!(await runSharp(sharpArgs))) {
      console.warn(`Warning: failed to process '${displayPath(filePath)}'`)
      return { before, after: before, optimized: false }
    }

    const outputPath = path.join(temporaryDirectory, path.basename(filePath))
    const outputType = await getPathType(outputPath)

    if (outputType !== "file") {
      console.warn(`Warning: no output produced for '${displayPath(filePath)}'`)
      return { before, after: before, optimized: false }
    }

    const after = (await fs.promises.stat(outputPath)).size

    if (after < before) {
      await fs.promises.copyFile(outputPath, filePath)
      formatResult(filePath, before, after)
      return { before, after, optimized: true }
    }

    formatResult(filePath, before, before)
    return { before, after: before, optimized: false }
  } finally {
    await removeTemporaryDirectory(temporaryDirectory)
  }
}

const printSummary = summary => {
  const bytesSaved = summary.totalBefore - summary.totalAfter
  const percentage =
    summary.totalBefore === 0
      ? 0
      : Math.floor((bytesSaved * 100) / summary.totalBefore)

  console.log("")
  console.log("Optimization complete")
  console.log(`Files processed : ${summary.processed}`)
  console.log(`Files optimized : ${summary.optimized}`)
  console.log(`Files skipped   : ${summary.skipped}`)
  console.log(`Total before    : ${humanizeBytes(summary.totalBefore)}`)
  console.log(`Total after     : ${humanizeBytes(summary.totalAfter)}`)
  console.log(
    `Space saved     : ${humanizeBytes(bytesSaved)} (-${percentage}%)`
  )
}

const main = async args => {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(usage)
    return
  }

  if (args.length === 0) {
    throw new Error(usage)
  }

  if (args.includes("--help") || args.includes("-h")) {
    throw new Error("--help cannot be combined with image paths")
  }

  const settings = {
    maxWidth: parseIntegerSetting("MAX_WIDTH", 2000),
    quality: parseIntegerSetting("QUALITY", 80, 100),
  }

  assertSharpAvailable()

  const files = await resolveInputFiles(args)

  if (files.length === 0) {
    console.log("No images found to optimize.")
    return
  }

  const summary = {
    processed: files.length,
    optimized: 0,
    skipped: 0,
    totalBefore: 0,
    totalAfter: 0,
  }

  for (const filePath of files) {
    const result = await optimizeImage(filePath, settings)
    summary.totalBefore += result.before
    summary.totalAfter += result.after

    if (result.optimized) {
      summary.optimized += 1
    } else {
      summary.skipped += 1
    }
  }

  printSummary(summary)
}

main(process.argv.slice(2)).catch(error => {
  console.error(`Error: ${error.message}`)
  process.exitCode = 1
})
