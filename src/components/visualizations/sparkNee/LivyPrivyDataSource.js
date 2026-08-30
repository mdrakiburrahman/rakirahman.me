import ParquetDataSource from "../data/ParquetDataSource"
import {
  LIVY_PRIVY_BENCHMARK_BYTE_LENGTH,
  LIVY_PRIVY_BENCHMARK_URL,
} from "./livyPrivyConfig"

const VISUAL_COLUMNS = [
  "record_type",
  "benchmark_query",
  "transport",
  "query_count",
  "success_count",
  "failure_count",
  "success_rate_pct",
  "effective_throughput_qps",
  "e2e_min_ms",
  "e2e_mean_ms",
  "e2e_p50_ms",
  "e2e_p90_ms",
  "e2e_p95_ms",
  "e2e_p99_ms",
  "e2e_max_ms",
  "metric",
  "outcome",
  "percentile",
  "metric_value",
]

const PRESENTATION_RECORD_TYPES = [
  "benchmark_metadata",
  "comparison_metric",
  "http_call_metric",
  "latency_percentile",
  "outcome",
  "phase_average",
  "retry_metric",
  "transport_summary",
]

export class LivyPrivyDataSource extends ParquetDataSource {
  constructor({
    url = LIVY_PRIVY_BENCHMARK_URL,
    byteLength = LIVY_PRIVY_BENCHMARK_BYTE_LENGTH,
    fetchImpl,
  } = {}) {
    super({ url, byteLength, fetchImpl })
  }

  loadVisualRows({ signal } = {}) {
    return this.queryRows({
      label: "Privy vs HC Livy benchmark",
      signal,
      filter: {
        is_visual: { $eq: true },
        record_type: { $in: PRESENTATION_RECORD_TYPES },
      },
      columns: VISUAL_COLUMNS,
    })
  }
}

export default LivyPrivyDataSource
