import ParquetDataSource from "../data/ParquetDataSource"
import {
  QUERY_GROUPING_SET_BY_PROJECT,
  SPARK_NEE_OBT_BYTE_LENGTH,
  SPARK_NEE_OBT_URL,
  SPARK_NEE_PROJECTS,
} from "./sparkNeeConfig"

const DAILY_METRIC_COLUMNS = [
  "record_type",
  "event_date",
  "wall_clock_seconds",
  "query_count",
  "model_count",
  "test_count",
  "ctas_count",
  "ctas_seconds",
  "peak_concurrency",
  "average_concurrency",
  "queries_per_minute",
  "tests_per_minute",
]

export class SparkNeeDataSource extends ParquetDataSource {
  constructor({
    url = SPARK_NEE_OBT_URL,
    byteLength = SPARK_NEE_OBT_BYTE_LENGTH,
    fetchImpl,
  } = {}) {
    super({ url, byteLength, fetchImpl })
  }

  loadDailyOverall({ signal } = {}) {
    return this.queryRows({
      label: "daily overall",
      signal,
      filter: { grouping_set_id: { $eq: 0 } },
      columns: DAILY_METRIC_COLUMNS,
    })
  }

  loadDailyProjects({ signal } = {}) {
    return this.queryRows({
      label: "daily by project",
      signal,
      filter: { grouping_set_id: { $eq: 1 } },
      columns: [...DAILY_METRIC_COLUMNS, "project_label"],
    })
  }

  loadInvocations({ signal } = {}) {
    return this.queryRows({
      label: "invocations",
      signal,
      filter: { grouping_set_id: { $eq: 2 } },
      columns: [
        "record_type",
        "event_timestamp",
        "project_label",
        "is_comparable_run",
        "query_count",
        "test_count",
        "wall_clock_seconds",
        "peak_concurrency",
        "ctas_seconds",
      ],
    })
  }

  loadQueryExecutions(projectLabels = SPARK_NEE_PROJECTS, { signal } = {}) {
    if (!Array.isArray(projectLabels) || projectLabels.length === 0) {
      throw new Error("At least one anonymized dbt project is required")
    }

    const groupingSets = [...new Set(projectLabels)].map(project => {
      const groupingSet = QUERY_GROUPING_SET_BY_PROJECT[project]
      if (groupingSet == null) {
        throw new Error(`Unknown anonymized dbt project: ${project}`)
      }
      return groupingSet
    })

    return this.queryRows({
      label: `query histories: ${projectLabels.join(", ")}`,
      signal,
      filter: { grouping_set_id: { $in: groupingSets } },
      columns: [
        "record_type",
        "event_timestamp",
        "project_label",
        "query_label",
        "resource_type",
        "is_comparable_run",
        "is_success",
        "is_ctas",
        "execution_seconds",
        "execute_seconds",
        "compile_seconds",
      ],
    })
  }
}

export default SparkNeeDataSource
