import { InstrumentedRangeBuffer } from "./InstrumentedRangeBuffer"

let hyparquetModule

const loadHyparquet = () => {
  if (!hyparquetModule) hyparquetModule = import("hyparquet")
  return hyparquetModule
}

const now = () =>
  typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now()

const stableQueryKey = ({ filter, columns }) =>
  JSON.stringify({
    filter,
    columns: columns ? [...columns].sort() : null,
  })

const createAbortError = () => {
  const error = new Error("The Parquet query was cancelled")
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

export class ParquetDataSource {
  constructor({ url, byteLength, fetchImpl, compressors, mergeGap } = {}) {
    this.url = url
    this.byteLength = byteLength
    this.compressors = compressors
    this.listeners = new Set()
    this.queryCache = new Map()
    this.metadataPromise = null
    this.buffer = new InstrumentedRangeBuffer({
      url,
      byteLength,
      fetchImpl,
      mergeGap,
    })
    this.unsubscribeBuffer = this.buffer.subscribe(event => this.emit(event))
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(event) {
    this.listeners.forEach(listener => listener(event))
  }

  getMetadata(label = "parquet metadata") {
    if (!this.metadataPromise) {
      this.metadataPromise = (async () => {
        const { parquetMetadataAsync } = await loadHyparquet()
        return parquetMetadataAsync(this.buffer.createView({ label }), {
          initialFetchSize: 1 << 18,
        })
      })().catch(error => {
        this.metadataPromise = null
        throw error
      })
    }

    return this.metadataPromise
  }

  async queryRows({ filter, columns, label = "parquet query", signal } = {}) {
    const key = stableQueryKey({ filter, columns })
    const cached = this.queryCache.get(key)

    if (cached) {
      const startedAt = now()
      this.emit({ type: "query-start", label })
      this.emit({ type: "query-cache-hit", label })
      try {
        const rows = await raceWithAbort(cached, signal)
        this.emit({
          type: "query-complete",
          label,
          durationMs: now() - startedAt,
        })
        return rows
      } catch (error) {
        if (error.name === "AbortError") {
          this.emit({ type: "query-abort", label })
        } else {
          if (this.queryCache.get(key) === cached) this.queryCache.delete(key)
          this.emit({ type: "query-error", label, error })
        }
        throw error
      }
    }

    const startedAt = now()
    this.emit({ type: "query-start", label })

    const query = (async () => {
      const metadata = await this.getMetadata(label)
      const { parquetQuery } = await loadHyparquet()
      return parquetQuery({
        file: this.buffer.createView({ label }),
        metadata,
        filter,
        ...(columns ? { columns } : {}),
        ...(this.compressors ? { compressors: this.compressors } : {}),
      })
    })()

    this.queryCache.set(key, query)
    query.catch(() => {
      if (this.queryCache.get(key) === query) this.queryCache.delete(key)
    })

    try {
      const rows = await raceWithAbort(query, signal)
      this.emit({
        type: "query-complete",
        label,
        durationMs: now() - startedAt,
      })
      return rows
    } catch (error) {
      if (error.name === "AbortError") {
        this.emit({ type: "query-abort", label })
      } else {
        if (this.queryCache.get(key) === query) this.queryCache.delete(key)
        this.emit({ type: "query-error", label, error })
      }
      throw error
    }
  }

  destroy() {
    this.unsubscribeBuffer()
    this.listeners.clear()
  }
}

export default ParquetDataSource
