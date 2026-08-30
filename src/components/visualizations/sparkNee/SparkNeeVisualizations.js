import React from "react"
import PropTypes from "prop-types"
import ParquetDashboard from "../ParquetDashboard"
import SparkNeeDataSource from "./SparkNeeDataSource"
import {
  NEE_CUTOVER_UTC,
  SPARK_NEE_OBT_BYTE_LENGTH,
  SPARK_NEE_OBT_ROW_GROUPS,
  SPARK_NEE_PROJECTS,
} from "./sparkNeeConfig"
import {
  buildBestFitSeries,
  buildInvocationSeries,
  buildInvocationComparison,
  buildMatchedQueryComparison,
  filterQueryExecutions,
  formatDuration,
  formatMultiplier,
  formatPercent,
  formatUtcDate,
} from "./sparkNeeMetrics"
import styles from "../visualizations.module.css"

const initialTelemetry = {
  activeQueries: 0,
  requests: 0,
  bytes: 0,
  cacheHits: 0,
  totalBytes: 0,
  duration: null,
}

const CUTOVER_DETAIL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

const telemetryReducer = (state, event) => {
  if (event.type === "query-start") {
    return {
      ...state,
      activeQueries: state.activeQueries + 1,
      duration: null,
    }
  }

  if (event.type === "network-read") {
    return {
      ...state,
      requests: state.requests + 1,
      bytes: state.bytes + event.bytes,
      totalBytes: state.totalBytes + event.bytes,
    }
  }

  if (event.type === "cache-hit" || event.type === "query-cache-hit") {
    return {
      ...state,
      cacheHits: state.cacheHits + 1,
    }
  }

  if (event.type === "query-complete") {
    return {
      ...state,
      activeQueries: Math.max(state.activeQueries - 1, 0),
      duration: event.durationMs,
    }
  }

  if (event.type === "query-error" || event.type === "query-abort") {
    return {
      ...state,
      activeQueries: Math.max(state.activeQueries - 1, 0),
    }
  }

  return state
}

const isAbortError = error => error && error.name === "AbortError"

const formatSuiteDuration = seconds =>
  Number.isFinite(seconds) ? `${Math.round(seconds / 60)}m` : "n/a"

const comparisonTone = value =>
  !Number.isFinite(value) ? undefined : value >= 0 ? "positive" : "negative"

const SparkNeeVisualizations = ({
  dataSource,
  cutover = NEE_CUTOVER_UTC,
  idPrefix = "spark-nee",
}) => {
  const ownedSource = React.useRef(null)
  if (!dataSource && !ownedSource.current) {
    ownedSource.current = new SparkNeeDataSource()
  }
  const source = dataSource || ownedSource.current
  const [data, setData] = React.useState(null)
  const [range, setRange] = React.useState(null)
  const [selectedProject, setSelectedProject] = React.useState(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [telemetry, dispatchTelemetry] = React.useReducer(
    telemetryReducer,
    initialTelemetry
  )

  React.useEffect(() => source.subscribe(dispatchTelemetry), [source])

  React.useEffect(() => {
    const controller = new AbortController()
    setInitialLoading(true)
    setError(null)

    Promise.all([
      source.loadDailyOverall({ signal: controller.signal }),
      source.loadDailyProjects({ signal: controller.signal }),
      source.loadInvocations({ signal: controller.signal }),
      source.loadQueryExecutions(SPARK_NEE_PROJECTS, {
        signal: controller.signal,
      }),
    ])
      .then(([dailyOverall, dailyProjects, invocations, queryExecutions]) => {
        setData({
          dailyOverall,
          dailyProjects,
          invocations,
          queryExecutions,
        })
      })
      .catch(loadError => {
        if (!isAbortError(loadError)) setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitialLoading(false)
      })

    return () => controller.abort()
  }, [source, cutover])

  React.useEffect(
    () => () => {
      if (!dataSource && ownedSource.current) ownedSource.current.destroy()
    },
    [dataSource]
  )

  const activeProjects = React.useMemo(
    () => (selectedProject ? [selectedProject] : SPARK_NEE_PROJECTS),
    [selectedProject]
  )
  const model = React.useMemo(() => {
    if (!data) {
      return {
        series: [],
        domain: null,
        comparisons: [],
        invocationComparison: null,
        error: null,
      }
    }

    try {
      const allInvocationSeries = buildInvocationSeries(
        data.invocations,
        SPARK_NEE_PROJECTS
      )
      const domainEnd = allInvocationSeries.length
        ? allInvocationSeries[allInvocationSeries.length - 1].date
        : cutover
      const domainStart = Math.max(
        allInvocationSeries.length ? allInvocationSeries[0].date : cutover,
        cutover - CUTOVER_DETAIL_WINDOW_MS
      )
      const domain = [domainStart, domainEnd]
      const invocationSeries = buildInvocationSeries(
        data.invocations,
        activeProjects,
        domain
      )
      const series = selectedProject
        ? invocationSeries
        : buildBestFitSeries(invocationSeries, {
            breakpoints: [cutover],
            groupBy: point => point.project,
            combine: "sum",
          })
      const queryRows = filterQueryExecutions(data.queryExecutions, {
        projects: activeProjects,
        range,
      })
      return {
        series,
        domain,
        comparisons: buildMatchedQueryComparison(queryRows, cutover),
        invocationComparison: buildInvocationComparison(
          data.invocations,
          cutover,
          {
            projects: activeProjects,
            range,
          }
        ),
        error: null,
      }
    } catch (calculationError) {
      return {
        series: [],
        domain: null,
        comparisons: [],
        invocationComparison: null,
        error: calculationError.message,
      }
    }
  }, [data, activeProjects, range, cutover, selectedProject])
  const { series, domain, comparisons, invocationComparison } = model
  const topQueries = comparisons.slice(0, 10)
  const loading = initialLoading || telemetry.activeQueries > 0
  const hasComparison =
    invocationComparison &&
    invocationComparison.complete &&
    Number.isFinite(invocationComparison.reductionPct)
  const faster = hasComparison && invocationComparison.reductionPct >= 0
  const projectCount = activeProjects.length
  const historyLabel = range ? `${range[0]} to ${range[1]}` : "all history"
  const cutoverTime = new Date(cutover).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
  const cutoverLabel = `${formatUtcDate(cutover)} ${cutoverTime} UTC`
  const comparisonMaximum = topQueries.length
    ? Math.max(
        ...topQueries.map(item =>
          Math.max(item.beforeSeconds, item.afterSeconds)
        )
      )
    : undefined

  const beforeLeaderboard = {
    title: "Slowest Before",
    items: topQueries.map(item => ({
      key: `${item.project}|${item.query}`,
      label: item.query,
      prefix: item.project,
      value: item.beforeSeconds,
    })),
    maxRows: 10,
    minHeight: 390,
    formatValue: formatDuration,
    emptyText: "not enough matched samples in this range",
    maxValue: comparisonMaximum,
  }
  const afterLeaderboard = {
    title: "Same Queries After",
    items: topQueries.map(item => ({
      key: `${item.project}|${item.query}`,
      label: item.query,
      prefix: item.project,
      value: item.afterSeconds,
      secondary: `${item.reductionPct >= 0 ? "-" : "+"}${formatPercent(
        item.reductionPct
      )}`,
      secondaryTone: comparisonTone(item.reductionPct),
    })),
    maxRows: 10,
    minHeight: 390,
    formatValue: formatDuration,
    emptyText: "not enough matched samples in this range",
    maxValue: comparisonMaximum,
  }
  const projectLeaderboard = {
    title: "By dbt Project",
    items: invocationComparison
      ? invocationComparison.projects.map(item => ({
          key: item.project,
          label: item.project,
          value: item.reductionPct == null ? 0 : item.reductionPct,
          barValue: item.reductionPct == null ? 0 : item.reductionPct,
          displayValue:
            item.reductionPct == null
              ? "n/a"
              : item.reductionPct >= 0
              ? `${formatPercent(item.reductionPct)} faster`
              : `${formatPercent(item.reductionPct)} slower`,
          tone: comparisonTone(item.reductionPct),
        }))
      : [],
    selected: selectedProject ? [selectedProject] : [],
    onSelect: project =>
      setSelectedProject(current => (current === project ? null : project)),
    maxRows: 5,
    minHeight: 190,
    formatValue: (_, item) => item.displayValue,
  }
  const parallelism = invocationComparison
    ? invocationComparison.parallelism
    : null
  const parallelismLeaderboard = {
    title: "Parallelism",
    items: parallelism
      ? [
          {
            key: "query-throughput",
            label: "query throughput",
            value: parallelism.queryThroughputLift,
            displayValue: formatMultiplier(parallelism.queryThroughputLift),
            tone: comparisonTone(parallelism.queryThroughputLift - 1),
          },
          {
            key: "test-throughput",
            label: "test throughput",
            value: parallelism.testThroughputLift,
            displayValue: formatMultiplier(parallelism.testThroughputLift),
            tone: comparisonTone(parallelism.testThroughputLift - 1),
          },
          {
            key: "peak-concurrency",
            label: "peak active queries",
            value: parallelism.peakAfter,
            displayValue: `${parallelism.peakBefore.toFixed(
              1
            )} -> ${parallelism.peakAfter.toFixed(1)}`,
            tone: comparisonTone(
              parallelism.peakAfter - parallelism.peakBefore
            ),
          },
        ]
      : [],
    maxRows: 3,
    minHeight: 150,
    formatValue: (_, item) => item.displayValue,
    emptyText: "not enough comparable invocations",
  }

  const chips = [
    range
      ? {
          key: "history",
          label: "dates",
          value: historyLabel,
          onClear: () => setRange(null),
        }
      : {
          key: "history",
          value: "all history",
        },
    {
      key: "cutover",
      label: "NEE",
      value: cutoverLabel,
    },
    {
      key: "eligibility",
      value: "successful full builds only",
    },
  ]

  if (selectedProject) {
    chips.push({
      key: "project",
      label: "project",
      value: selectedProject,
      onClear: () => setSelectedProject(null),
    })
  }

  return (
    <div className={styles.visualizationSuite}>
      <ParquetDashboard
        caption="Interactive Spark dbt Native Execution performance dashboard backed by a public Parquet OBT in Azure Blob Storage"
        title="Spark dbt Native Execution Impact"
        subtitle={`${projectCount} dbt project${
          projectCount === 1 ? "" : "s"
        } ~ ${comparisons.length.toLocaleString()} matched queries ~ NEE rollout start ${formatUtcDate(
          cutover
        )}`}
        heroValue={
          hasComparison
            ? `${formatPercent(invocationComparison.reductionPct)} ${
                faster ? "faster" : "slower"
              }`
            : "not enough data"
        }
        heroDetail={
          hasComparison
            ? `${formatSuiteDuration(
                invocationComparison.beforeWallClockSeconds
              )} -> ${formatSuiteDuration(
                invocationComparison.afterWallClockSeconds
              )} median suite wall clock`
            : "select a range spanning the NEE cutover"
        }
        heroTone={!hasComparison ? "neutral" : faster ? "positive" : "negative"}
        seriesLabel={
          selectedProject
            ? "Comparable Invocation Wall-Clock Minutes ~ Transaction Grain"
            : "Comparable Suite Wall-Clock Minutes ~ Linear Best-Fit Trend"
        }
        seriesHint="Lower is better."
        seriesDescription={
          selectedProject
            ? "Transaction-grain values for the selected project. Drag horizontally to filter the comparison metrics."
            : "The sum of project-level least-squares trends fitted independently before and after NEE. Select a project to reveal its raw transaction values."
        }
        series={series}
        domain={domain}
        range={range}
        onRangeChange={setRange}
        marker={{ date: cutover, label: "NEE rollout start" }}
        seriesAggregation="none"
        includeZero={false}
        brushGranularity="day"
        chips={chips}
        onClearAll={() => {
          setRange(null)
          setSelectedProject(null)
        }}
        largeLeaderboards={[beforeLeaderboard, afterLeaderboard]}
        stackedLeaderboards={[projectLeaderboard, parallelismLeaderboard]}
        telemetry={{
          requests: telemetry.requests,
          bytes: telemetry.bytes,
          cacheHits: telemetry.cacheHits,
          totalBytes: telemetry.totalBytes,
          byteLength: source.byteLength || SPARK_NEE_OBT_BYTE_LENGTH,
          duration: telemetry.duration,
          assetLabel: "the public OBT",
          rowGroups: SPARK_NEE_OBT_ROW_GROUPS,
        }}
        loading={loading}
        error={error || model.error}
        idPrefix={idPrefix}
      />
    </div>
  )
}

SparkNeeVisualizations.propTypes = {
  dataSource: PropTypes.shape({
    byteLength: PropTypes.number,
    subscribe: PropTypes.func.isRequired,
    loadDailyOverall: PropTypes.func.isRequired,
    loadDailyProjects: PropTypes.func.isRequired,
    loadInvocations: PropTypes.func.isRequired,
    loadQueryExecutions: PropTypes.func.isRequired,
  }),
  cutover: PropTypes.number,
  idPrefix: PropTypes.string,
}

export default SparkNeeVisualizations
