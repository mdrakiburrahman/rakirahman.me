# Blog tools

| Tool                                       | Purpose                                          | Command                                |
| ------------------------------------------ | ------------------------------------------------ | -------------------------------------- |
| [`new-blog.js`](new-blog.js)               | Scaffold a minimal unpublished blog post.        | `npm run new-blog -- <flags>`          |
| [`optimize-images.js`](optimize-images.js) | Compress and resize blog images when beneficial. | `npm run optimize-images -- <path...>` |

## Create a blog post

Create a minimal unpublished draft with the required metadata:

```sh
npm run new-blog -- \
  --title "My Blog Post" \
  --description "A concise summary" \
  --tags "Azure,Gatsby" \
  --toc true
```

Tags are supplied as one comma-separated value, and `--toc` must be `true` or
`false`. The command derives a kebab-case slug from the title, uses the current
date, and creates:

- `content/<slug>/index.mdx`
- `content/<slug>/images/`
- `content/<slug>/featured-image.png`
- `src/assets/images/og-<slug>.png`

Both generated images initially use `src/assets/images/og-tbd.png`. The command
refuses to overwrite an existing post or OG image. You can also invoke the tool
directly with `node tools/new-blog.js` and the same flags.

## Optimizing images

Large, high-resolution screenshots make `gatsby develop` crawl because
`gatsby-plugin-sharp` re-processes every multi-megabyte image on each build. The
[bootstrapper](../contrib/bootstrap-dev-env.sh) installs the
[`sharp`](https://github.com/lovell/sharp) CLI, and
[`optimize-images.js`](optimize-images.js) uses it to downscale oversized images
and re-encode them with aggressive compression in place. An original image is
only overwritten when the result is smaller, so the tool is safe to re-run.

Run it whenever you add new images:

```bash
# Optimize every image under content/, src/ and static/
npm run optimize-images -- "*"

# Optimize a single new image
npm run optimize-images -- content/my-new-post/images/screenshot.png

# Optimize a whole folder of new images recursively
npm run optimize-images -- content/my-new-post

# Optimize several specific paths at once
npm run optimize-images -- content/foo/a.png static/b.jpg
```

Tunables:

| Variable    | Default | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| `MAX_WIDTH` | `2000`  | Max output width in px; images are never upscaled. |
| `QUALITY`   | `80`    | Encoder quality from 1 to 100.                     |

```bash
MAX_WIDTH=2400 QUALITY=85 npm run optimize-images -- "*"
```

You can also invoke the tool directly with
`node tools/optimize-images.js <path...>`.
