#!/bin/bash
#
# ---------------------------------------------------------------------------------------
#
#       Optimizes images in-place using `sharp` (libvips) to speed up `gatsby develop`.
#
#       Oversized screenshots are the main reason gatsby-plugin-sharp is slow: every
#       build it re-processes multi-megabyte, 4000px-wide PNGs. This script downscales
#       them to a sane max width and re-encodes with aggressive (but visually lossless
#       enough) compression, only overwriting the original when the result is smaller.
#
#       Usage:
#
#         # Optimize every image under content/, src/ and static/
#         ./scripts/optimize-images.sh "*"
#
#         # Optimize a specific image
#         ./scripts/optimize-images.sh content/delta-dotnet/featured-image.png
#
#         # Optimize a folder of images (recursively)
#         ./scripts/optimize-images.sh content/delta-dotnet
#
#         # Optimize several paths at once
#         ./scripts/optimize-images.sh content/foo/a.png static/b.jpg
#
#       Tunables (env vars):
#
#         MAX_WIDTH   Max output width in px (default 2000). Taller-than-wide images
#                     are only downscaled if wider than this; never upscaled.
#         QUALITY     Encoder quality 1-100 (default 80).
#
# ---------------------------------------------------------------------------------------
#

set -euo pipefail

MAX_WIDTH="${MAX_WIDTH:-2000}"
QUALITY="${QUALITY:-80}"
SEARCH_DIRS=(content src static)

if ! command -v sharp &> /dev/null; then
    echo "❌ 'sharp' CLI not found. Install it via the bootstrapper:" >&2
    echo "     ./contrib/bootstrap-dev-env.sh" >&2
    exit 1
fi

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 \"*\" | <path> [<path>...]" >&2
    echo "  \"*\"    optimize every image under: ${SEARCH_DIRS[*]}" >&2
    echo "  <path>  a specific image file or a directory of images" >&2
    exit 1
fi

GIT_ROOT="$(git rev-parse --show-toplevel)"
cd "$GIT_ROOT"

# Collect the list of files to process into a temp file (null-delimited to be safe
# with spaces in paths).
FILE_LIST="$(mktemp)"
trap 'rm -f "$FILE_LIST"' EXIT

collect() {
    # Appends matching image files under a directory to FILE_LIST.
    find "$1" -type f \
        \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) \
        -print0 >> "$FILE_LIST"
}

if [ "$1" = "*" ] || [ "$1" = "all" ]; then
    for d in "${SEARCH_DIRS[@]}"; do
        [ -d "$d" ] && collect "$d"
    done
else
    for arg in "$@"; do
        if [ -d "$arg" ]; then
            collect "$arg"
        elif [ -f "$arg" ]; then
            printf '%s\0' "$arg" >> "$FILE_LIST"
        else
            echo "⚠️  Skipping '$arg' (not a file or directory)" >&2
        fi
    done
fi

total_before=0
total_after=0
optimized=0
skipped=0

human() {
    # Bytes -> human readable.
    numfmt --to=iec --suffix=B "$1" 2>/dev/null || echo "${1}B"
}

optimize_one() {
    local f="$1"
    local ext="${f##*.}"
    ext="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"

    local tmpdir
    tmpdir="$(mktemp -d)"

    local args=(-q "$QUALITY")
    case "$ext" in
        png)       args+=(--palette) ;;    # lossy palette quantisation w/ alpha
        jpg|jpeg)  args+=(--mozjpeg) ;;     # mozjpeg encoder
        webp)      : ;;                     # sharp defaults are already good
    esac

    if ! sharp -i "$f" -o "$tmpdir" "${args[@]}" \
            resize "$MAX_WIDTH" --withoutEnlargement > /dev/null 2>&1; then
        echo "⚠️  Failed to process '$f', leaving untouched" >&2
        rm -rf "$tmpdir"
        return
    fi

    local out="$tmpdir/$(basename "$f")"
    local before after
    before="$(stat -c%s "$f")"

    if [ ! -f "$out" ]; then
        echo "⚠️  No output produced for '$f', leaving untouched" >&2
        rm -rf "$tmpdir"
        skipped=$((skipped + 1))
        total_before=$((total_before + before))
        total_after=$((total_after + before))
        return
    fi

    after="$(stat -c%s "$out")"
    total_before=$((total_before + before))

    if [ "$after" -lt "$before" ]; then
        cp "$out" "$f"
        total_after=$((total_after + after))
        optimized=$((optimized + 1))
        local pct=$(( (before - after) * 100 / before ))
        printf '✅ %-60s %10s -> %10s  (-%d%%)\n' \
            "$f" "$(human "$before")" "$(human "$after")" "$pct"
    else
        total_after=$((total_after + before))
        skipped=$((skipped + 1))
        printf '⏭️  %-60s %10s (already optimal)\n' "$f" "$(human "$before")"
    fi

    rm -rf "$tmpdir"
}

count=0
while IFS= read -r -d '' f; do
    count=$((count + 1))
    optimize_one "$f"
done < "$FILE_LIST"

if [ "$count" -eq 0 ]; then
    echo "No images found to optimize."
    exit 0
fi

echo ""
echo "┌────────────────────────┐"
echo "│ Optimization complete  │"
echo "└────────────────────────┘"
echo "Files processed : $count"
echo "Files optimized : $optimized"
echo "Files skipped   : $skipped"
echo "Total before    : $(human "$total_before")"
echo "Total after     : $(human "$total_after")"
if [ "$total_before" -gt 0 ]; then
    saved=$(( (total_before - total_after) * 100 / total_before ))
    echo "Space saved     : $(human $((total_before - total_after))) (-${saved}%)"
fi
