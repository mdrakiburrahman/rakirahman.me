const now = () =>
  typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now()

const createAbortError = () => {
  const error = new Error("The Parquet request was cancelled")
  error.name = "AbortError"
  return error
}

const raceWithAbort = (promise, signal) => {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(createAbortError())

  return new Promise((resolve, reject) => {
    const abort = () => reject(createAbortError())
    signal.addEventListener("abort", abort, { once: true })

    promise.then(
      value => {
        signal.removeEventListener("abort", abort)
        resolve(value)
      },
      error => {
        signal.removeEventListener("abort", abort)
        reject(error)
      }
    )
  })
}

export class RangeRequestError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = "RangeRequestError"
    this.details = details
  }
}

export class InstrumentedRangeBuffer {
  constructor({ url, byteLength, fetchImpl, mergeGap = 64 * 1024 }) {
    if (!url) throw new Error("A Parquet URL is required")
    if (!Number.isInteger(byteLength) || byteLength <= 0) {
      throw new Error("A positive Parquet byte length is required")
    }

    this.url = url
    this.byteLength = byteLength
    this.fetchImpl = fetchImpl
    this.mergeGap = mergeGap
    this.cache = new Map()
    this.listeners = new Set()
    this.queue = []
    this.flushScheduled = false
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  createView({ label = "cube", signal } = {}) {
    return {
      byteLength: this.byteLength,
      slice: (start, end) => this.slice(start, end, { label, signal }),
    }
  }

  slice(start, end = this.byteLength, { label = "cube", signal } = {}) {
    this.validateRange(start, end)
    const key = `${start}:${end}`
    const cached = this.cache.get(key)

    if (cached) {
      this.emit({
        type: "cache-hit",
        label,
        start,
        end,
        bytes: end - start,
      })
      return raceWithAbort(cached, signal)
    }

    let request
    request = new Promise((resolve, reject) => {
      this.queue.push({ start, end, label, resolve, reject })
      this.scheduleFlush()
    })

    this.cache.set(key, request)
    request.catch(() => {
      if (this.cache.get(key) === request) this.cache.delete(key)
    })

    return raceWithAbort(request, signal)
  }

  validateRange(start, end) {
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end <= start ||
      end > this.byteLength
    ) {
      throw new RangeRequestError(
        `Invalid Parquet byte range [${start}, ${end})`,
        {
          start,
          end,
          byteLength: this.byteLength,
        }
      )
    }
  }

  scheduleFlush() {
    if (this.flushScheduled) return
    this.flushScheduled = true
    Promise.resolve().then(() => this.flush())
  }

  flush() {
    this.flushScheduled = false
    const queued = this.queue.sort((left, right) => left.start - right.start)
    this.queue = []
    const groups = []

    queued.forEach(item => {
      const current = groups[groups.length - 1]
      if (current && item.start <= current.end + this.mergeGap) {
        current.end = Math.max(current.end, item.end)
        current.items.push(item)
      } else {
        groups.push({
          start: item.start,
          end: item.end,
          items: [item],
        })
      }
    })

    groups.forEach(group => {
      const labels = [...new Set(group.items.map(item => item.label))]
      const label = labels.length === 1 ? labels[0] : labels.join(" + ")

      this.fetchRange(group.start, group.end, label).then(
        buffer => {
          group.items.forEach(item => {
            item.resolve(
              buffer.slice(item.start - group.start, item.end - group.start)
            )
          })
        },
        error => group.items.forEach(item => item.reject(error))
      )
    })
  }

  async fetchRange(start, end, label) {
    const fetchImpl =
      this.fetchImpl || (typeof fetch === "function" ? fetch : null)
    if (typeof fetchImpl !== "function") {
      throw new RangeRequestError("This browser does not provide fetch()")
    }

    const startedAt = now()
    let response

    try {
      response = await fetchImpl(this.url, {
        headers: {
          Range: `bytes=${start}-${end - 1}`,
        },
      })
    } catch (error) {
      throw new RangeRequestError(
        "The Parquet byte range could not be fetched. Check the network and Blob CORS policy.",
        { start, end, cause: error }
      )
    }

    if (response.status !== 206) {
      if (response.body && response.body.cancel) response.body.cancel()
      throw new RangeRequestError(
        `Expected a 206 byte-range response but received ${response.status}`,
        { start, end, status: response.status }
      )
    }

    const contentRange = response.headers.get("Content-Range")
    const match =
      contentRange && contentRange.match(/^bytes (\d+)-(\d+)\/(\d+)$/)

    if (
      !match ||
      Number(match[1]) !== start ||
      Number(match[2]) !== end - 1 ||
      Number(match[3]) !== this.byteLength
    ) {
      throw new RangeRequestError(
        `Blob Storage returned an invalid Content-Range: ${
          contentRange || "missing"
        }`,
        { start, end, contentRange }
      )
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength !== end - start) {
      throw new RangeRequestError(
        `Expected ${end - start} bytes but received ${buffer.byteLength}`,
        { start, end, received: buffer.byteLength }
      )
    }

    this.emit({
      type: "network-read",
      label,
      start,
      end,
      bytes: buffer.byteLength,
      durationMs: now() - startedAt,
    })

    return buffer
  }

  emit(event) {
    this.listeners.forEach(listener => listener(event))
  }
}
