import { decompress } from "fzstd"
import { InstrumentedRangeBuffer } from "./InstrumentedRangeBuffer"
import {
  ALL_TIME_GROUPING_SET,
  DASHBOARD_DIMENSIONS,
  DAILY_GROUPING_SET_BY_MASK,
  EMPTY_FILTERS,
  NYC311_CUBE_BYTE_LENGTH,
  NYC311_CUBE_URL,
  getDailyGroupingSet,
  getGroupingSetMask,
  getRangeSegments,
} from "./nyc311CubeSchema"

const compressorMap = {
  ZSTD: (compressed, outputSize) =>
    decompress(compressed, new Uint8Array(outputSize)),
}

let hyparquetModule

const loadHyparquet = () => {
  if (!hyparquetModule) hyparquetModule = import("hyparquet")
  return hyparquetModule
}

const now = () =>
  typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now()

const normaliseFilters = filters =>
  DASHBOARD_DIMENSIONS.reduce((normalised, dimension) => {
    const selected = filters && filters[dimension.key]
    if (selected == null) {
      normalised[dimension.key] = null
    } else if (Array.isArray(selected)) {
      normalised[dimension.key] = selected.length ? [...selected] : null
    } else {
      throw new Error(
        `Filter "${dimension.key}" must be an array of selected values or null`
      )
    }
    return normalised
  }, {})

const timestamp = value => {
  const result =
    value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(result)) throw new Error(`Invalid cube date: ${value}`)
  return result
}

const sortSeries = rows => {
  const values = new Map()

  rows.forEach(row => {
    const date = timestamp(row.d)
    values.set(date, (values.get(date) || 0) + Number(row.n || 0))
  })

  return [...values.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((left, right) => left.date - right.date)
}

const stableQueryKey = ({ filter, columns }) =>
  JSON.stringify({
    filter,
    columns: columns ? [...columns].sort() : null,
  })

const raceWithAbort = (promise, signal) => {
  if (!signal) return promise
  if (signal.aborted) {
    const error = new Error("The Parquet query was cancelled")
    error.name = "AbortError"
    return Promise.reject(error)
  }

  return new Promise((resolve, reject) => {
    const abort = () => {
      const error = new Error("The Parquet query was cancelled")
      error.name = "AbortError"
      reject(error)
    }
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

export const summarizeRows = (rows, filters = EMPTY_FILTERS) => {
  const normalised = normaliseFilters(filters)
  const selected = DASHBOARD_DIMENSIONS.reduce((sets, dimension) => {
    sets[dimension.key] = normalised[dimension.key]
      ? new Set(normalised[dimension.key])
      : null
    return sets
  }, {})

  const rowMatches = (row, ignoredDimension) =>
    DASHBOARD_DIMENSIONS.every(dimension => {
      if (dimension.key === ignoredDimension) return true
      const accepted = selected[dimension.key]
      return !accepted || accepted.has(row[dimension.key])
    })

  const leaderboards = DASHBOARD_DIMENSIONS.reduce((result, dimension) => {
    const counts = new Map()

    rows.forEach(row => {
      if (!rowMatches(row, dimension.key)) return
      const value = row[dimension.key]
      if (value == null) return
      counts.set(value, (counts.get(value) || 0) + Number(row.n || 0))
    })

    result[dimension.key] = [...counts.entries()]
      .map(([key, value]) => ({ key, value }))
      .sort((left, right) => right.value - left.value)
    return result
  }, {})

  const total = rows.reduce(
    (sum, row) => sum + (rowMatches(row) ? Number(row.n || 0) : 0),
    0
  )

  return {
    total,
    leaderboards,
  }
}

export class Nyc311CubeDataSource {
  constructor({
    url = NYC311_CUBE_URL,
    byteLength = NYC311_CUBE_BYTE_LENGTH,
    fetchImpl,
  } = {}) {
    this.url = url
    this.byteLength = byteLength
    this.listeners = new Set()
    this.queryCache = new Map()
    this.metadataPromise = null
    this.buffer = new InstrumentedRangeBuffer({
      url,
      byteLength,
      fetchImpl,
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

  getMetadata(label) {
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

  async queryRows({ filter, columns, label, signal }) {
    const key = stableQueryKey({ filter, columns })
    const cached = this.queryCache.get(key)

    if (cached) {
      const startedAt = now()
      this.emit({ type: "query-start", label })
      this.emit({ type: "query-cache-hit", label })
      const rows = await raceWithAbort(cached, signal)
      this.emit({
        type: "query-complete",
        label,
        durationMs: now() - startedAt,
      })
      return rows
    }

    const startedAt = now()
    this.emit({ type: "query-start", label })

    const query = (async () => {
      const metadata = await this.getMetadata(label)
      const { parquetQuery } = await loadHyparquet()
      return parquetQuery({
        file: this.buffer.createView({ label, signal }),
        metadata,
        compressors: compressorMap,
        filter,
        ...(columns ? { columns } : {}),
      })
    })()

    this.queryCache.set(key, query)

    try {
      const rows = await raceWithAbort(query, signal)
      this.emit({
        type: "query-complete",
        label,
        durationMs: now() - startedAt,
      })
      return rows
    } catch (error) {
      if (this.queryCache.get(key) === query) this.queryCache.delete(key)
      if (error.name !== "AbortError") {
        this.emit({ type: "query-error", label, error })
      }
      throw error
    }
  }

  async loadInitial({ signal } = {}) {
    const dailyGroupingSet = DAILY_GROUPING_SET_BY_MASK[0]
    const rows = await this.queryRows({
      label: "initial",
      signal,
      filter: {
        grouping_set: {
          $in: [ALL_TIME_GROUPING_SET, dailyGroupingSet],
        },
      },
    })

    const dailyRows = []
    const allTimeRows = []

    rows.forEach(row => {
      if (row.grouping_set === dailyGroupingSet) {
        dailyRows.push(row)
      } else if (row.grouping_set === ALL_TIME_GROUPING_SET) {
        allTimeRows.push(row)
      }
    })

    return {
      series: sortSeries(dailyRows),
      allTimeRows,
    }
  }

  async loadDailySeries(filters, { signal } = {}) {
    const normalised = normaliseFilters(filters)
    const mask = getGroupingSetMask(normalised)

    if (mask === 0) {
      throw new Error(
        "The unfiltered daily series is part of the initial cube load"
      )
    }

    const filter = {
      grouping_set: {
        $eq: getDailyGroupingSet(normalised),
      },
    }

    DASHBOARD_DIMENSIONS.forEach(dimension => {
      const values = normalised[dimension.key]
      if (values) filter[dimension.key] = { $in: values }
    })

    const rows = await this.queryRows({
      label: `chart:${mask}:${JSON.stringify(normalised)}`,
      signal,
      filter,
    })

    return sortSeries(rows)
  }

  async loadRangeRows(range, { signal } = {}) {
    if (!range || range.length !== 2) {
      throw new Error("A two-value date range is required")
    }

    const start = timestamp(range[0])
    const endExclusive = timestamp(range[1])
    if (endExclusive <= start) {
      throw new Error("The date range end must follow its start")
    }

    const segments = getRangeSegments(start, endExclusive)
    const label = `range:${start}:${endExclusive}`

    const segmentRows = await Promise.all(
      segments.map(segment =>
        this.queryRows({
          label,
          signal,
          filter: {
            grouping_set: { $eq: segment.groupingSet },
            d: {
              $gte: new Date(segment.start),
              $lt: new Date(segment.endExclusive),
            },
          },
        })
      )
    )

    return segmentRows.reduce((rows, segment) => [...rows, ...segment], [])
  }

  destroy() {
    this.unsubscribeBuffer()
    this.listeners.clear()
  }
}

export default Nyc311CubeDataSource
