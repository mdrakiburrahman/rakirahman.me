import { SPARK_NEE_PROJECTS } from "./sparkNeeConfig"

const DAY_IN_MS = 24 * 60 * 60 * 1000

const toTimestamp = value => {
  const result =
    value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(result))
    throw new Error(`Invalid Parquet date: ${value}`)
  return result
}

const toFiniteNumber = (value, label) => {
  const result = Number(value)
  if (!Number.isFinite(result)) {
    throw new Error(`Invalid numeric ${label}: ${value}`)
  }
  return result
}

const inRange = (value, range) => {
  if (!range) return true
  const timestamp = toTimestamp(value)
  return timestamp >= toTimestamp(range[0]) && timestamp < toTimestamp(range[1])
}

export const median = values => {
  if (!values.length) return null
  const sorted = values.slice().sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

export const eligibleQueryExecution = row =>
  row.record_type === "query_execution" &&
  row.is_comparable_run === true &&
  row.is_success === true &&
  Number.isFinite(Number(row.execution_seconds))

export const buildMatchedQueryComparison = (rows, cutover, minSamples = 2) => {
  const groups = new Map()

  rows.filter(eligibleQueryExecution).forEach(row => {
    const key = `${row.project_label}|${row.query_label}`
    const current = groups.get(key) || {
      project: row.project_label,
      query: row.query_label,
      before: [],
      after: [],
    }
    const side = toTimestamp(row.event_timestamp) < cutover ? "before" : "after"
    current[side].push(
      toFiniteNumber(row.execution_seconds, "query execution time")
    )
    groups.set(key, current)
  })

  return [...groups.values()]
    .filter(
      item =>
        item.before.length >= minSamples && item.after.length >= minSamples
    )
    .map(item => {
      const beforeSeconds = median(item.before)
      const afterSeconds = median(item.after)
      return {
        ...item,
        beforeSeconds,
        afterSeconds,
        savedSeconds: beforeSeconds - afterSeconds,
        reductionPct:
          beforeSeconds === 0
            ? 0
            : (100 * (beforeSeconds - afterSeconds)) / beforeSeconds,
      }
    })
    .sort((left, right) => right.beforeSeconds - left.beforeSeconds)
}

const eligibleInvocation = row =>
  row.record_type === "invocation" && row.is_comparable_run === true

const sum = values => values.reduce((total, value) => total + value, 0)

const aggregateInvocations = rows => {
  if (!rows.length) return null

  const wallClockSeconds = rows.map(row =>
    toFiniteNumber(row.wall_clock_seconds, "invocation wall clock")
  )
  const totalWallClockSeconds = sum(wallClockSeconds)
  if (totalWallClockSeconds <= 0) return null

  return {
    samples: rows.length,
    medianWallClockSeconds: median(wallClockSeconds),
    queriesPerMinute:
      (60 *
        sum(
          rows.map(row =>
            toFiniteNumber(row.query_count, "invocation query count")
          )
        )) /
      totalWallClockSeconds,
    testsPerMinute:
      (60 *
        sum(
          rows.map(row =>
            toFiniteNumber(row.test_count, "invocation test count")
          )
        )) /
      totalWallClockSeconds,
    medianPeakConcurrency: median(
      rows.map(row =>
        toFiniteNumber(row.peak_concurrency, "invocation peak concurrency")
      )
    ),
    medianCtasSeconds: median(
      rows.map(row => toFiniteNumber(row.ctas_seconds, "invocation CTAS time"))
    ),
  }
}

const reductionPct = (before, after) =>
  before === 0 ? 0 : (100 * (before - after)) / before

export const buildInvocationComparison = (
  rows,
  cutover,
  { projects = SPARK_NEE_PROJECTS, range = null } = {}
) => {
  const projectSet = new Set(projects)
  const filtered = rows.filter(
    row =>
      eligibleInvocation(row) &&
      projectSet.has(row.project_label) &&
      inRange(row.event_timestamp, range)
  )
  const grouped = new Map(
    projects.map(project => [project, { before: [], after: [] }])
  )

  filtered.forEach(row => {
    const project = grouped.get(row.project_label)
    const side = toTimestamp(row.event_timestamp) < cutover ? "before" : "after"
    project[side].push(row)
  })

  const projectComparisons = projects.map(project => {
    const sides = grouped.get(project)
    const before = aggregateInvocations(sides.before)
    const after = aggregateInvocations(sides.after)

    return {
      project,
      before,
      after,
      reductionPct:
        before && after
          ? reductionPct(
              before.medianWallClockSeconds,
              after.medianWallClockSeconds
            )
          : null,
    }
  })

  const completeProjects = projectComparisons.filter(
    item => item.before && item.after
  )
  const beforeWallClockSeconds = sum(
    completeProjects.map(item => item.before.medianWallClockSeconds)
  )
  const afterWallClockSeconds = sum(
    completeProjects.map(item => item.after.medianWallClockSeconds)
  )
  const beforeRows = filtered.filter(
    row => toTimestamp(row.event_timestamp) < cutover
  )
  const afterRows = filtered.filter(
    row => toTimestamp(row.event_timestamp) >= cutover
  )
  const before = aggregateInvocations(beforeRows)
  const after = aggregateInvocations(afterRows)

  return {
    projects: projectComparisons,
    complete: completeProjects.length === projects.length,
    beforeWallClockSeconds,
    afterWallClockSeconds,
    reductionPct:
      completeProjects.length && beforeWallClockSeconds > 0
        ? reductionPct(beforeWallClockSeconds, afterWallClockSeconds)
        : null,
    parallelism:
      before && after
        ? {
            queryThroughputLift:
              after.queriesPerMinute / before.queriesPerMinute,
            testThroughputLift: after.testsPerMinute / before.testsPerMinute,
            peakBefore: before.medianPeakConcurrency,
            peakAfter: after.medianPeakConcurrency,
            ctasReductionPct: reductionPct(
              before.medianCtasSeconds,
              after.medianCtasSeconds
            ),
          }
        : null,
  }
}

export const filterQueryExecutions = (
  rows,
  { projects = SPARK_NEE_PROJECTS, range = null } = {}
) => {
  const projectSet = new Set(projects)
  return rows.filter(
    row =>
      projectSet.has(row.project_label) && inRange(row.event_timestamp, range)
  )
}

export const buildDailySeries = (
  dailyOverall,
  dailyProjects,
  projects = SPARK_NEE_PROJECTS
) => {
  const allProjectsSelected =
    projects.length === SPARK_NEE_PROJECTS.length &&
    SPARK_NEE_PROJECTS.every(project => projects.includes(project))
  const rows = allProjectsSelected
    ? dailyOverall
    : dailyProjects.filter(row => projects.includes(row.project_label))
  const points = new Map()

  rows.forEach(row => {
    const date = toTimestamp(row.event_date)
    const hours =
      toFiniteNumber(row.wall_clock_seconds, "daily wall clock") / 3600
    points.set(date, (points.get(date) || 0) + hours)
  })

  return [...points.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((left, right) => left.date - right.date)
}

export const buildInvocationSeries = (
  rows,
  projects = SPARK_NEE_PROJECTS,
  domain = null
) => {
  const projectSet = new Set(projects)

  return rows
    .filter(
      row =>
        eligibleInvocation(row) &&
        projectSet.has(row.project_label) &&
        (!domain ||
          (toTimestamp(row.event_timestamp) >= domain[0] &&
            toTimestamp(row.event_timestamp) <= domain[1]))
    )
    .map(row => ({
      date: toTimestamp(row.event_timestamp),
      value:
        toFiniteNumber(row.wall_clock_seconds, "invocation wall clock") / 60,
      project: row.project_label,
    }))
    .sort((left, right) => left.date - right.date)
}

const buildLinearModel = series => {
  if (series.length === 1) return () => series[0].value

  const origin = series[0].date
  const values = series.map(point => ({
    x: (point.date - origin) / DAY_IN_MS,
    y: point.value,
  }))
  const meanX = sum(values.map(point => point.x)) / values.length
  const meanY = sum(values.map(point => point.y)) / values.length
  const variance = sum(values.map(point => Math.pow(point.x - meanX, 2)))
  const covariance = sum(
    values.map(point => (point.x - meanX) * (point.y - meanY))
  )
  const slope = variance > Number.EPSILON ? covariance / variance : 0

  return date =>
    Math.max(0, meanY + slope * ((date - origin) / DAY_IN_MS - meanX))
}

const fitLinearTrend = (series, groupBy, combine) => {
  const groups = new Map()

  series.forEach(point => {
    const key = groupBy ? groupBy(point) : "series"
    const group = groups.get(key) || []
    group.push(point)
    groups.set(key, group)
  })

  const models = [...groups.values()].map(buildLinearModel)
  return series.map(point => {
    const fittedValues = models.map(model => model(point.date))
    const fittedTotal = sum(fittedValues)

    return {
      ...point,
      value:
        combine === "sum" ? fittedTotal : fittedTotal / fittedValues.length,
    }
  })
}

export const buildBestFitSeries = (
  series,
  { breakpoints = [], groupBy, combine = "mean" } = {}
) => {
  const sorted = series.slice().sort((left, right) => left.date - right.date)
  const boundaries = breakpoints
    .filter(Number.isFinite)
    .slice()
    .sort((left, right) => left - right)
  const segments = []
  let segmentStart = 0

  boundaries.forEach(boundary => {
    const segmentEnd = sorted.findIndex(
      (point, index) => index >= segmentStart && point.date >= boundary
    )
    if (segmentEnd === -1) return
    if (segmentEnd > segmentStart) {
      segments.push(sorted.slice(segmentStart, segmentEnd))
    }
    segmentStart = segmentEnd
  })

  if (segmentStart < sorted.length) {
    segments.push(sorted.slice(segmentStart))
  }

  return segments.flatMap(segment => fitLinearTrend(segment, groupBy, combine))
}

export const formatUtcDate = value =>
  new Date(value)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    .toLowerCase()

export const formatDuration = seconds => {
  if (!Number.isFinite(seconds)) return "n/a"
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds)}s`
}

export const formatPercent = value =>
  Number.isFinite(value) ? `${Math.abs(value).toFixed(1)}%` : "n/a"

export const formatMultiplier = value =>
  Number.isFinite(value) ? `${value.toFixed(2)}x` : "n/a"

export const addUtcDays = (timestamp, days) => timestamp + days * DAY_IN_MS
