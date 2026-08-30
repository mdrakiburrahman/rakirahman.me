import React from "react"
import { withA11y } from "@storybook/addon-a11y"
import {
  GroupingSetDiagram,
  LivyPrivyBenchmark,
  ParquetDashboard,
  SparkNeeVisualizations,
  SPARK_NEE_OBT_BYTE_LENGTH,
} from "../src/components/visualizations"

export default {
  title: "Visualizations",
  decorators: [withA11y],
}

const DAY = 24 * 60 * 60 * 1000
const start = Date.parse("2026-01-01T00:00:00Z")
const fixtureSeries = Array.from({ length: 70 }, (_, index) => ({
  date: start + index * DAY,
  value: 20 + Math.sin(index / 7) * 8,
}))

const fixtureLeaderboard = title => ({
  title,
  items: ["alpha", "bravo", "charlie", "delta"].map((key, index) => ({
    key,
    value: 120 - index * 23,
  })),
  selected: [],
  maxRows: 4,
  minHeight: 190,
})

const groupingFixture = [
  {
    id: "summary",
    label: "summary",
    note: "small aggregate reads",
    tone: "total",
    items: [
      {
        id: 0,
        name: "daily",
        rows: 70,
        kb: 90,
        rowGroups: 1,
        tone: "total",
      },
      {
        id: 1,
        name: "by category",
        rows: 350,
        kb: 140,
        rowGroups: 2,
        tone: "total",
      },
    ],
  },
  {
    id: "detail",
    label: "detail",
    note: "contiguous detail histories",
    tone: "depth2",
    items: [
      {
        id: 10,
        name: "partition one",
        rows: 12000,
        kb: 900,
        rowGroups: 12,
        tone: "depth2",
      },
      {
        id: 11,
        name: "partition two",
        rows: 8000,
        kb: 620,
        rowGroups: 8,
        tone: "depth2",
      },
    ],
  },
]

const footerFixture = {
  id: "footer",
  name: "footer ~ index",
  description: "row-group statistics fetched first",
  rows: null,
  kb: 180,
  rowGroups: null,
  tone: "footer",
}

const fixtureTransportSummaries = {
  privy: {
    throughput: 80,
    min: 50,
    mean: 320,
    p50: 275,
    p90: 455,
    p95: 477.5,
    p99: 495.5,
    max: 500,
  },
  livy: {
    throughput: 5,
    min: 100,
    mean: 1200,
    p50: 700,
    p90: 2044,
    p95: 2266,
    p99: 2452.24,
    max: 2500,
  },
}

const fixtureMetricRows = (recordType, transport, values) =>
  Object.entries(values).map(([metric, metricValue]) => ({
    record_type: recordType,
    transport,
    metric,
    metric_value: metricValue,
  }))

const benchmarkFixtureRows = [
  ...fixtureMetricRows("benchmark_metadata", null, {
    query_count_per_transport: 10000,
    block_count: 5,
    queries_per_block: 2000,
    max_concurrency: 32,
    livy_poll_interval_ms: 50,
    sessions_warmed: 1,
    sessions_reused_across_blocks: 1,
  }),
  ...Object.entries(fixtureTransportSummaries).map(([transport, summary]) => ({
    record_type: "transport_summary",
    benchmark_query: "SELECT 1 AS value",
    transport,
    query_count: 10000,
    success_count: 10000,
    failure_count: 0,
    success_rate_pct: 100,
    effective_throughput_qps: summary.throughput,
    e2e_min_ms: summary.min,
    e2e_mean_ms: summary.mean,
    e2e_p50_ms: summary.p50,
    e2e_p90_ms: summary.p90,
    e2e_p95_ms: summary.p95,
    e2e_p99_ms: summary.p99,
    e2e_max_ms: summary.max,
  })),
  ...fixtureMetricRows("comparison_metric", null, {
    livy_over_privy_e2e_p50:
      fixtureTransportSummaries.livy.p50 / fixtureTransportSummaries.privy.p50,
    livy_over_privy_e2e_p95:
      fixtureTransportSummaries.livy.p95 / fixtureTransportSummaries.privy.p95,
    livy_over_privy_e2e_p99:
      fixtureTransportSummaries.livy.p99 / fixtureTransportSummaries.privy.p99,
    privy_over_livy_effective_throughput:
      fixtureTransportSummaries.privy.throughput /
      fixtureTransportSummaries.livy.throughput,
  }),
  ...["privy", "livy"].flatMap(transport =>
    Array.from({ length: 101 }, (_, percentile) => ({
      record_type: "latency_percentile",
      transport,
      percentile,
      metric_value:
        transport === "privy"
          ? 50 + percentile * 4.5
          : 100 + percentile * percentile * 0.24,
    }))
  ),
  ...[
    ["privy", "request_prep", "request prep", 10],
    ["privy", "relay_transit_queue", "relay transit/queue", 240],
    ["privy", "remote_execution", "remote execution", 70],
    ["privy", "decode_validate", "decode/validate", 1],
    ["privy", "retry_backoff", "retry backoff", 0],
    ["privy", "other_client_trace", "other client/trace", 1],
    ["livy", "request_prep", "request prep", 10],
    ["livy", "submit_http", "submit HTTP", 850],
    ["livy", "poll_http", "poll HTTP", 300],
    ["livy", "poll_waits_50ms", "50 ms poll waits", 40],
    ["livy", "decode_validate", "decode/validate", 1],
    ["livy", "retry_backoff", "retry backoff", 20],
    ["livy", "other_client_trace", "other client/trace", 5],
  ].map(([transport, metric, operation, metricValue]) => ({
    record_type: "phase_average",
    transport,
    metric,
    operation,
    metric_value: metricValue,
  })),
  ...["privy", "livy"].map(transport => ({
    record_type: "outcome",
    transport,
    outcome: "success",
    metric_value: 10000,
  })),
  ...fixtureMetricRows("retry_metric", "privy", {
    queries_with_retry: 0,
    queries_with_retry_pct: 0,
    total_retry_attempts: 0,
    max_retries_for_one_query: 0,
  }),
  ...fixtureMetricRows("retry_metric", "livy", {
    queries_with_retry: 1200,
    queries_with_retry_pct: 12,
    total_retry_attempts: 70000,
    max_retries_for_one_query: 800,
  }),
  ...fixtureMetricRows("http_call_metric", "privy", {
    total: 10000,
    per_success: 1,
  }),
  ...fixtureMetricRows("http_call_metric", "livy", {
    total: 80000,
    per_success: 8,
  }),
]

const unavailableDataSource = {
  byteLength: SPARK_NEE_OBT_BYTE_LENGTH,
  subscribe: () => () => {},
  loadDailyOverall: () =>
    Promise.reject(new Error("Example Blob Storage connection failure")),
  loadDailyProjects: () => Promise.resolve([]),
  loadInvocations: () => Promise.resolve([]),
  loadQueryExecutions: () => Promise.resolve([]),
}

const benchmarkFixtureDataSource = {
  loadVisualRows: () => Promise.resolve(benchmarkFixtureRows),
}

const unavailableBenchmarkDataSource = {
  loadVisualRows: () =>
    Promise.reject(new Error("Example Blob Storage connection failure")),
}

export const GenericParquetDashboard = _ => (
  <ParquetDashboard
    caption="Generic fixture dashboard"
    title="public parquet ~ reusable dashboard"
    subtitle="fixture data ~ controlled presentation component"
    heroValue="34.2% faster"
    heroDetail="82m -> 54m median wall clock"
    seriesLabel="weekly fixture metric"
    series={fixtureSeries}
    domain={[fixtureSeries[0].date, fixtureSeries[69].date]}
    range={null}
    onRangeChange={() => {}}
    marker={{
      date: Date.parse("2026-02-15T00:00:00Z"),
      label: "change enabled",
    }}
    chips={[
      { key: "history", value: "all history" },
      { key: "source", value: "public parquet" },
    ]}
    largeLeaderboards={[
      fixtureLeaderboard("baseline"),
      fixtureLeaderboard("comparison"),
    ]}
    stackedLeaderboards={[
      fixtureLeaderboard("categories"),
      fixtureLeaderboard("throughput"),
    ]}
    telemetry={{
      requests: 3,
      bytes: 240000,
      cacheHits: 1,
      totalBytes: 240000,
      byteLength: 1200000,
      duration: 84,
      assetLabel: "the fixture",
      rowGroups: 24,
    }}
  />
)

export const GenericGroupingSets = _ => (
  <GroupingSetDiagram
    groups={groupingFixture}
    footer={footerFixture}
    title="one parquet ~ reusable physical layout"
    subtitle="logical sections mapped to physical row groups"
    summaryValue="20,420"
    summaryLabel="rows"
    footerNote="hover or focus a section to trace its physical row groups"
  />
)

export const FixtureLivyPrivyBenchmark = _ => (
  <LivyPrivyBenchmark
    dataSource={benchmarkFixtureDataSource}
    idPrefix="storybook-livy-privy-fixture"
  />
)

export const LiveLivyPrivyBenchmark = _ => (
  <LivyPrivyBenchmark idPrefix="storybook-livy-privy-live" />
)

export const LivyPrivyErrorState = _ => (
  <LivyPrivyBenchmark
    dataSource={unavailableBenchmarkDataSource}
    idPrefix="storybook-livy-privy-error"
  />
)

export const LiveSparkNee = _ => (
  <SparkNeeVisualizations idPrefix="storybook-spark-nee" />
)

export const SparkNeeErrorState = _ => (
  <SparkNeeVisualizations
    dataSource={unavailableDataSource}
    idPrefix="storybook-error"
  />
)
