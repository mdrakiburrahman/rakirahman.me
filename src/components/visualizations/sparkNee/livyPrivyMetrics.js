import {
  LIVY_PRIVY_TRANSPORT_LABELS,
  LIVY_PRIVY_TRANSPORTS,
} from "./livyPrivyConfig"

const PERCENTILE_CHECKPOINTS = [0, 10, 25, 50, 75, 90, 95, 99, 100]

const PHASE_ORDER = {
  privy: [
    "request_prep",
    "relay_transit_queue",
    "remote_execution",
    "decode_validate",
    "retry_backoff",
    "other_client_trace",
  ],
  livy: [
    "request_prep",
    "submit_http",
    "poll_http",
    "poll_waits_50ms",
    "decode_validate",
    "retry_backoff",
    "other_client_trace",
  ],
}

const PHASE_LABELS = {
  request_prep: "Request Prep",
  relay_transit_queue: "Relay Transit / Queue",
  remote_execution: "Remote Execution",
  decode_validate: "Decode / Validate",
  retry_backoff: "Retry Backoff",
  other_client_trace: "Other Client / Trace",
  submit_http: "Submit HTTP",
  poll_http: "Poll HTTP",
  poll_waits_50ms: "50 ms Poll Waits",
}

const toFiniteNumber = (value, label) => {
  const result = Number(value)
  if (!Number.isFinite(result)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return result
}

const toInteger = (value, label) => {
  const result = toFiniteNumber(value, label)
  if (!Number.isInteger(result)) {
    throw new Error(`Expected an integer ${label}: ${value}`)
  }
  return result
}

const rowsOfType = (rows, recordType) =>
  rows.filter(row => row.record_type === recordType)

const transportRows = (rows, transport) =>
  rows.filter(row => row.transport === transport)

const requireOne = (rows, label) => {
  if (rows.length !== 1) {
    throw new Error(`Expected one ${label}, found ${rows.length}`)
  }
  return rows[0]
}

const metricMap = (rows, recordType, transport) => {
  const filtered = transport
    ? transportRows(rowsOfType(rows, recordType), transport)
    : rowsOfType(rows, recordType)
  const result = new Map()

  filtered.forEach(row => {
    if (!row.metric) throw new Error(`${recordType} row is missing a metric`)
    if (result.has(row.metric)) {
      throw new Error(`Duplicate ${recordType} metric: ${row.metric}`)
    }
    result.set(
      row.metric,
      toFiniteNumber(row.metric_value, `${recordType}.${row.metric}`)
    )
  })

  return result
}

const requireMetric = (metrics, name, label) => {
  if (!metrics.has(name)) throw new Error(`Missing ${label || name}`)
  return metrics.get(name)
}

const normalizeSummary = row => ({
  transport: row.transport,
  queryCount: toInteger(row.query_count, `${row.transport} query count`),
  successCount: toInteger(row.success_count, `${row.transport} success count`),
  failureCount: toInteger(row.failure_count, `${row.transport} failure count`),
  successRatePct: toFiniteNumber(
    row.success_rate_pct,
    `${row.transport} success rate`
  ),
  throughputQps: toFiniteNumber(
    row.effective_throughput_qps,
    `${row.transport} throughput`
  ),
  e2e: {
    min: toFiniteNumber(row.e2e_min_ms, `${row.transport} minimum latency`),
    mean: toFiniteNumber(row.e2e_mean_ms, `${row.transport} mean latency`),
    p50: toFiniteNumber(row.e2e_p50_ms, `${row.transport} p50 latency`),
    p90: toFiniteNumber(row.e2e_p90_ms, `${row.transport} p90 latency`),
    p95: toFiniteNumber(row.e2e_p95_ms, `${row.transport} p95 latency`),
    p99: toFiniteNumber(row.e2e_p99_ms, `${row.transport} p99 latency`),
    max: toFiniteNumber(row.e2e_max_ms, `${row.transport} maximum latency`),
  },
})

const buildCurve = (rows, transport) => {
  const points = transportRows(
    rowsOfType(rows, "latency_percentile"),
    transport
  )
  if (points.length !== 101) {
    throw new Error(
      `Expected 101 ${transport} latency percentiles, found ${points.length}`
    )
  }

  const byPercentile = new Map()
  points.forEach(row => {
    const percentile = toInteger(
      row.percentile,
      `${transport} latency percentile`
    )
    if (percentile < 0 || percentile > 100) {
      throw new Error(`Invalid ${transport} percentile: ${percentile}`)
    }
    if (byPercentile.has(percentile)) {
      throw new Error(`Duplicate ${transport} percentile: ${percentile}`)
    }
    byPercentile.set(
      percentile,
      toFiniteNumber(row.metric_value, `${transport} p${percentile} latency`)
    )
  })

  for (let percentile = 0; percentile <= 100; percentile += 1) {
    if (!byPercentile.has(percentile)) {
      throw new Error(`Missing ${transport} percentile: ${percentile}`)
    }
  }

  return [...byPercentile.entries()]
    .map(([percentile, value]) => ({ percentile, value }))
    .sort((left, right) => left.percentile - right.percentile)
}

const buildPhases = (rows, transport) => {
  const phases = new Map()
  transportRows(rowsOfType(rows, "phase_average"), transport).forEach(row => {
    if (phases.has(row.metric)) {
      throw new Error(`Duplicate ${transport} phase: ${row.metric}`)
    }
    phases.set(row.metric, {
      key: row.metric,
      label: PHASE_LABELS[row.metric],
      value: toFiniteNumber(
        row.metric_value,
        `${transport} ${row.metric} phase`
      ),
    })
  })

  return PHASE_ORDER[transport].map(metric => {
    if (!phases.has(metric)) {
      throw new Error(`Missing ${transport} phase: ${metric}`)
    }
    return phases.get(metric)
  })
}

const assertClose = (actual, expected, label) => {
  const tolerance = Math.max(Math.abs(expected) * 0.0005, 0.001)
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${label} expected ${expected.toFixed(3)}, calculated ${actual.toFixed(
        3
      )}`
    )
  }
}

export const buildLivyPrivyBenchmarkModel = rows => {
  if (!Array.isArray(rows)) throw new Error("Benchmark rows must be an array")

  const summaryRows = rowsOfType(rows, "transport_summary")
  const summaries = {
    privy: normalizeSummary(
      requireOne(transportRows(summaryRows, "privy"), "Privy transport summary")
    ),
    livy: normalizeSummary(
      requireOne(
        transportRows(summaryRows, "livy"),
        "HC Livy transport summary"
      )
    ),
  }

  const metadataMetrics = metricMap(rows, "benchmark_metadata")
  const metadata = {
    queryCountPerTransport: toInteger(
      requireMetric(metadataMetrics, "query_count_per_transport"),
      "query count per transport"
    ),
    blockCount: toInteger(
      requireMetric(metadataMetrics, "block_count"),
      "block count"
    ),
    queriesPerBlock: toInteger(
      requireMetric(metadataMetrics, "queries_per_block"),
      "queries per block"
    ),
    maxConcurrency: toInteger(
      requireMetric(metadataMetrics, "max_concurrency"),
      "maximum concurrency"
    ),
    livyPollIntervalMs: toInteger(
      requireMetric(metadataMetrics, "livy_poll_interval_ms"),
      "Livy poll interval"
    ),
    sessionsWarmed: Boolean(requireMetric(metadataMetrics, "sessions_warmed")),
    sessionsReused: Boolean(
      requireMetric(metadataMetrics, "sessions_reused_across_blocks")
    ),
  }

  const comparisonMetrics = metricMap(rows, "comparison_metric")
  const comparisons = {
    p50: requireMetric(
      comparisonMetrics,
      "livy_over_privy_e2e_p50",
      "p50 comparison"
    ),
    p95: requireMetric(
      comparisonMetrics,
      "livy_over_privy_e2e_p95",
      "p95 comparison"
    ),
    p99: requireMetric(
      comparisonMetrics,
      "livy_over_privy_e2e_p99",
      "p99 comparison"
    ),
    throughput: requireMetric(
      comparisonMetrics,
      "privy_over_livy_effective_throughput",
      "throughput comparison"
    ),
  }

  assertClose(
    summaries.livy.e2e.p50 / summaries.privy.e2e.p50,
    comparisons.p50,
    "p50 comparison"
  )
  assertClose(
    summaries.livy.e2e.p95 / summaries.privy.e2e.p95,
    comparisons.p95,
    "p95 comparison"
  )
  assertClose(
    summaries.livy.e2e.p99 / summaries.privy.e2e.p99,
    comparisons.p99,
    "p99 comparison"
  )
  assertClose(
    summaries.privy.throughputQps / summaries.livy.throughputQps,
    comparisons.throughput,
    "throughput comparison"
  )

  LIVY_PRIVY_TRANSPORTS.forEach(transport => {
    if (summaries[transport].queryCount !== metadata.queryCountPerTransport) {
      throw new Error(
        `${LIVY_PRIVY_TRANSPORT_LABELS[transport]} query count does not match metadata`
      )
    }
  })

  const curves = {
    privy: buildCurve(rows, "privy"),
    livy: buildCurve(rows, "livy"),
  }
  const curveMaps = {
    privy: new Map(curves.privy.map(point => [point.percentile, point.value])),
    livy: new Map(curves.livy.map(point => [point.percentile, point.value])),
  }

  const phases = {
    privy: buildPhases(rows, "privy"),
    livy: buildPhases(rows, "livy"),
  }
  const retries = {
    privy: metricMap(rows, "retry_metric", "privy"),
    livy: metricMap(rows, "retry_metric", "livy"),
  }
  const httpCalls = {
    privy: metricMap(rows, "http_call_metric", "privy"),
    livy: metricMap(rows, "http_call_metric", "livy"),
  }

  LIVY_PRIVY_TRANSPORTS.forEach(transport => {
    const success = requireOne(
      transportRows(rowsOfType(rows, "outcome"), transport).filter(
        row => row.outcome === "success"
      ),
      `${transport} successful outcome`
    )
    const outcomeCount = toInteger(
      success.metric_value,
      `${transport} successful outcomes`
    )
    if (outcomeCount !== summaries[transport].successCount) {
      throw new Error(`${transport} outcome count does not match its summary`)
    }
  })

  const benchmarkQueries = new Set(
    summaryRows.map(row => row.benchmark_query).filter(Boolean)
  )
  if (benchmarkQueries.size !== 1) {
    throw new Error(
      `Expected one benchmark query, found ${benchmarkQueries.size}`
    )
  }
  const query = [...benchmarkQueries][0]
  const latency = PERCENTILE_CHECKPOINTS.map(percentile => ({
    percentile,
    privy: curveMaps.privy.get(percentile),
    livy: curveMaps.livy.get(percentile),
  }))
  return {
    query,
    metadata,
    summaries,
    comparisons,
    curves,
    latency,
    phases,
    phaseMaximum: Math.max(
      ...LIVY_PRIVY_TRANSPORTS.reduce(
        (values, transport) =>
          values.concat(phases[transport].map(phase => phase.value)),
        []
      )
    ),
    outcomeRows: [
      {
        key: "logical-successes",
        label: "Logical Successes",
        privy: summaries.privy.successCount,
        livy: summaries.livy.successCount,
        format: "count",
      },
      {
        key: "logical-failures",
        label: "Logical Failures",
        privy: summaries.privy.failureCount,
        livy: summaries.livy.failureCount,
        format: "count",
      },
      {
        key: "queries-with-retry",
        label: "Queries With Retry",
        privy: requireMetric(retries.privy, "queries_with_retry"),
        livy: requireMetric(retries.livy, "queries_with_retry"),
        privyDetail: `${requireMetric(
          retries.privy,
          "queries_with_retry_pct"
        ).toFixed(3)}%`,
        livyDetail: `${requireMetric(
          retries.livy,
          "queries_with_retry_pct"
        ).toFixed(3)}%`,
        format: "count",
      },
      {
        key: "total-retry-attempts",
        label: "Total Retry Attempts",
        privy: requireMetric(retries.privy, "total_retry_attempts"),
        livy: requireMetric(retries.livy, "total_retry_attempts"),
        format: "count",
      },
      {
        key: "max-retries",
        label: "Max Retries for One Query",
        privy: requireMetric(retries.privy, "max_retries_for_one_query"),
        livy: requireMetric(retries.livy, "max_retries_for_one_query"),
        format: "count",
      },
      {
        key: "total-http-calls",
        label: "Total HTTP Calls",
        privy: requireMetric(httpCalls.privy, "total"),
        livy: requireMetric(httpCalls.livy, "total"),
        format: "count",
      },
      {
        key: "http-calls-per-success",
        label: "HTTP Calls / Success",
        privy: requireMetric(httpCalls.privy, "per_success"),
        livy: requireMetric(httpCalls.livy, "per_success"),
        format: "decimal",
      },
    ],
  }
}

const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const compactDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const formatBenchmarkMilliseconds = value =>
  `${oneDecimal.format(value)} ms`

export const formatBenchmarkThroughput = value =>
  `${oneDecimal.format(value)} q/s`

export const formatBenchmarkCount = value =>
  Math.round(value).toLocaleString("en-US")

export const formatBenchmarkPercent = value =>
  `${compactDecimal.format(value)}%`

export const formatBenchmarkDecimal = value => compactDecimal.format(value)

export const formatBenchmarkMultiplier = value => `${value.toFixed(2)}x`
