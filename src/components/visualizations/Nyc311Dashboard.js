import React from "react"
import PropTypes from "prop-types"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Leaderboard from "./Leaderboard"
import RangeTelemetry from "./RangeTelemetry"
import TimeSeriesBrush from "./TimeSeriesBrush"
import Nyc311CubeDataSource, {
  summarizeRows,
} from "./data/Nyc311CubeDataSource"
import {
  DASHBOARD_DIMENSIONS,
  EMPTY_FILTERS,
  NYC311_CUBE_BYTE_LENGTH,
  getGroupingSetMask,
} from "./data/nyc311CubeSchema"
import styles from "./visualizations.module.css"

const emptySummary = {
  total: 0,
  leaderboards: DASHBOARD_DIMENSIONS.reduce((result, dimension) => {
    result[dimension.key] = []
    return result
  }, {}),
}

const initialTelemetry = {
  activeLabel: null,
  requests: 0,
  bytes: 0,
  cacheHits: 0,
  totalBytes: 0,
  duration: null,
}

const telemetryReducer = (state, event) => {
  if (event.type === "query-start") {
    return {
      ...state,
      activeLabel: event.label,
      requests: 0,
      bytes: 0,
      cacheHits: 0,
      duration: null,
    }
  }

  if (event.type === "network-read") {
    const isActive = event.label === state.activeLabel
    return {
      ...state,
      requests: isActive ? state.requests + 1 : state.requests,
      bytes: isActive ? state.bytes + event.bytes : state.bytes,
      totalBytes: state.totalBytes + event.bytes,
    }
  }

  if (event.type === "cache-hit" || event.type === "query-cache-hit") {
    return {
      ...state,
      cacheHits:
        event.label === state.activeLabel
          ? state.cacheHits + 1
          : state.cacheHits,
    }
  }

  if (event.type === "query-complete" && event.label === state.activeLabel) {
    return {
      ...state,
      duration: event.durationMs,
    }
  }

  return state
}

const isAbortError = error => error && error.name === "AbortError"

const Nyc311Dashboard = ({
  dataSource,
  title = "nyc 311 ~ daily requests",
  idPrefix = "nyc311",
}) => {
  const ownedSource = React.useRef(null)
  if (!dataSource && !ownedSource.current) {
    ownedSource.current = new Nyc311CubeDataSource()
  }
  const source = dataSource || ownedSource.current
  const reduceMotion = useReducedMotion()
  const [initial, setInitial] = React.useState(null)
  const [series, setSeries] = React.useState([])
  const [rangeRows, setRangeRows] = React.useState(null)
  const [filters, setFilters] = React.useState(EMPTY_FILTERS)
  const [range, setRange] = React.useState(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [chartLoading, setChartLoading] = React.useState(false)
  const [rangeLoading, setRangeLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [telemetry, dispatchTelemetry] = React.useReducer(
    telemetryReducer,
    initialTelemetry
  )
  const loading = initialLoading || chartLoading || rangeLoading
  const lastSummary = React.useRef(emptySummary)

  React.useEffect(() => source.subscribe(dispatchTelemetry), [source])

  React.useEffect(() => {
    const controller = new AbortController()
    setInitialLoading(true)
    setError(null)

    source
      .loadInitial({ signal: controller.signal })
      .then(result => {
        setInitial(result)
        setSeries(result.series)
      })
      .catch(loadError => {
        if (!isAbortError(loadError)) setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitialLoading(false)
      })

    return () => controller.abort()
  }, [source])

  React.useEffect(() => {
    if (!initial) return undefined
    if (getGroupingSetMask(filters) === 0) {
      setSeries(initial.series)
      setChartLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setChartLoading(true)
    setError(null)

    source
      .loadDailySeries(filters, { signal: controller.signal })
      .then(setSeries)
      .catch(loadError => {
        if (!isAbortError(loadError)) setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setChartLoading(false)
      })

    return () => controller.abort()
  }, [source, initial, filters])

  React.useEffect(() => {
    if (!range) {
      setRangeRows(null)
      setRangeLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setRangeLoading(true)
    setError(null)

    source
      .loadRangeRows(range, { signal: controller.signal })
      .then(setRangeRows)
      .catch(loadError => {
        if (!isAbortError(loadError)) setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setRangeLoading(false)
      })

    return () => controller.abort()
  }, [source, range])

  React.useEffect(
    () => () => {
      if (!dataSource && ownedSource.current) ownedSource.current.destroy()
    },
    [dataSource]
  )

  const summary = React.useMemo(() => {
    if (!initial) return emptySummary
    const rows = range ? rangeRows : initial.allTimeRows
    if (!rows) return lastSummary.current
    return summarizeRows(rows, filters)
  }, [initial, rangeRows, range, filters])

  React.useEffect(() => {
    lastSummary.current = summary
  }, [summary])

  const domain = React.useMemo(() => {
    if (!initial || !initial.series.length) return null
    return [
      initial.series[0].date,
      initial.series[initial.series.length - 1].date,
    ]
  }, [initial])

  const toggleFilter = (dimension, value) => {
    setFilters(current => {
      const selected = current[dimension] || []
      const next = selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value]
      return {
        ...current,
        [dimension]: next.length ? next : null,
      }
    })
  }

  const chips = DASHBOARD_DIMENSIONS.reduce((result, dimension) => {
    const selected = filters[dimension.key]
    if (!selected || !selected.length) return result
    return [
      ...result,
      {
        key: dimension.key,
        label: dimension.key,
        value:
          selected.length === 1 ? selected[0] : `${selected.length} selected`,
        clear: () =>
          setFilters(current => ({
            ...current,
            [dimension.key]: null,
          })),
      },
    ]
  }, [])

  if (range) {
    chips.push({
      key: "dates",
      label: "dates",
      value: `${range[0]} ~ ${range[1]}`,
      clear: () => setRange(null),
    })
  }

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 650, damping: 45, mass: 0.7 }

  return (
    <figure className={styles.dashboard}>
      <figcaption className={styles.visuallyHidden}>
        Interactive NYC 311 dashboard backed by a Parquet cube in Azure Blob
        Storage
      </figcaption>

      <div className={styles.dashboardHeader}>
        <div>
          <h3 className={styles.dashboardTitle}>{title}</h3>
          <div className={styles.dashboardSubtitle}>
            {range ? `${range[0]} to ${range[1]}` : "all time"}
            {" ~ "}
            <span className={loading ? styles.loadingValue : ""}>
              {summary.total.toLocaleString()}
            </span>{" "}
            requests in view
          </div>
        </div>

        <RangeTelemetry
          loading={loading}
          requests={telemetry.requests}
          bytes={telemetry.bytes}
          cacheHits={telemetry.cacheHits}
          totalBytes={telemetry.totalBytes}
          byteLength={source.byteLength || NYC311_CUBE_BYTE_LENGTH}
          duration={telemetry.duration}
        />
      </div>

      <TimeSeriesBrush
        series={series}
        domain={domain}
        range={range}
        onRangeChange={setRange}
        idPrefix={idPrefix}
      />

      <div className={styles.filterBar}>
        {chips.length === 0 && (
          <span className={styles.filterHint}>
            <span className={styles.filterHintLong}>
              no filters ~ click a leaderboard row, or brush the chart (click
              the chart to clear)
            </span>
            <span className={styles.filterHintShort}>
              no filters ~ tap a row or brush the chart
            </span>
          </span>
        )}

        <AnimatePresence initial={false}>
          {chips.map(chip => (
            <motion.button
              key={chip.key}
              className={styles.filterChip}
              type="button"
              layout
              transition={transition}
              initial={{ opacity: 0, x: -10, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              onClick={chip.clear}
              aria-label={`Clear ${chip.label} filter`}
            >
              <span className={styles.filterChipLabel}>{chip.label}</span>
              <span className={styles.filterChipValue}>
                {String(chip.value).toLowerCase()}
              </span>
              <span className={styles.filterChipClose} aria-hidden="true">
                x
              </span>
            </motion.button>
          ))}

          {chips.length > 0 && (
            <motion.button
              key="clear-all"
              className={styles.clearAll}
              type="button"
              layout
              transition={transition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              onClick={() => {
                setFilters(EMPTY_FILTERS)
                setRange(null)
              }}
            >
              clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className={styles.dashboardError} role="alert">
          data unavailable: {error}
        </div>
      )}

      <div
        className={`${styles.leaderboardGrid} ${
          loading ? styles.leaderboardGridLoading : ""
        }`}
      >
        <Leaderboard
          title={DASHBOARD_DIMENSIONS[0].title}
          items={summary.leaderboards.agency}
          selected={filters.agency || []}
          onSelect={value => toggleFilter("agency", value)}
        />
        <Leaderboard
          title={DASHBOARD_DIMENSIONS[1].title}
          items={summary.leaderboards.complaint}
          selected={filters.complaint || []}
          onSelect={value => toggleFilter("complaint", value)}
        />
        <div className={styles.stackedLeaderboards}>
          <Leaderboard
            title={DASHBOARD_DIMENSIONS[2].title}
            items={summary.leaderboards.borough}
            selected={filters.borough || []}
            onSelect={value => toggleFilter("borough", value)}
            maxRows={6}
            minHeight={210}
          />
          <Leaderboard
            title={DASHBOARD_DIMENSIONS[3].title}
            items={summary.leaderboards.channel}
            selected={filters.channel || []}
            onSelect={value => toggleFilter("channel", value)}
            maxRows={5}
            minHeight={172}
          />
        </div>
      </div>
    </figure>
  )
}

Nyc311Dashboard.propTypes = {
  dataSource: PropTypes.shape({
    byteLength: PropTypes.number,
    subscribe: PropTypes.func.isRequired,
    loadInitial: PropTypes.func.isRequired,
    loadDailySeries: PropTypes.func.isRequired,
    loadRangeRows: PropTypes.func.isRequired,
  }),
  title: PropTypes.string,
  idPrefix: PropTypes.string,
}

export default Nyc311Dashboard
