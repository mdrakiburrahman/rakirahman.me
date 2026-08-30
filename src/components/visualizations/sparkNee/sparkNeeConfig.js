export const SPARK_NEE_OBT_URL =
  "https://rakirahman.blob.core.windows.net/data/dbt-nee-perf/dbt-nee-perf-cube-v1.parquet"

export const SPARK_NEE_OBT_BYTE_LENGTH = 4503311
export const SPARK_NEE_OBT_ROW_GROUPS = 54
export const NEE_CUTOVER_UTC = Date.parse("2026-08-28T00:00:00Z")

export const SPARK_NEE_PROJECTS = ["dbt-1", "dbt-2", "dbt-3", "dbt-4", "dbt-5"]

export const QUERY_GROUPING_SET_BY_PROJECT = {
  "dbt-1": 10,
  "dbt-2": 11,
  "dbt-3": 12,
  "dbt-4": 13,
  "dbt-5": 14,
}
