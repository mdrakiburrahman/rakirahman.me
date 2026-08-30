import React from "react"
import PropTypes from "prop-types"
import LivyPrivyDataSource from "./LivyPrivyDataSource"
import { LIVY_PRIVY_TRANSPORT_LABELS } from "./livyPrivyConfig"
import {
  buildLivyPrivyBenchmarkModel,
  formatBenchmarkCount,
  formatBenchmarkDecimal,
  formatBenchmarkMilliseconds,
  formatBenchmarkMultiplier,
  formatBenchmarkPercent,
  formatBenchmarkThroughput,
} from "./livyPrivyMetrics"
import styles from "../visualizations.module.css"

const classNames = (...names) => names.filter(Boolean).join(" ")

const toneClass = transport =>
  transport === "privy" ? styles.benchmarkPrivyTone : styles.benchmarkLivyTone

const barWidth = (value, maximum, scale) => {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) {
    return 0
  }
  if (value <= 0) return 0
  const ratio =
    scale === "log" ? Math.log1p(value) / Math.log1p(maximum) : value / maximum
  return Math.max(1.5, Math.min(100, ratio * 100))
}

const MetricBarCell = ({
  value,
  maximum,
  formatValue,
  transport,
  detail,
  scale = "linear",
  cellRole,
}) => (
  <div className={styles.benchmarkMetricCell} role={cellRole}>
    <span
      className={classNames(styles.benchmarkMetricBar, toneClass(transport))}
      style={{ width: `${barWidth(value, maximum, scale)}%` }}
      aria-hidden="true"
    />
    <span className={styles.benchmarkMetricValue}>
      {formatValue(value)}
      {detail && <small>{detail}</small>}
    </span>
  </div>
)

MetricBarCell.propTypes = {
  value: PropTypes.number.isRequired,
  maximum: PropTypes.number.isRequired,
  formatValue: PropTypes.func.isRequired,
  transport: PropTypes.oneOf(["privy", "livy"]).isRequired,
  detail: PropTypes.string,
  scale: PropTypes.oneOf(["linear", "log"]),
  cellRole: PropTypes.oneOf(["cell"]),
}

const PairTable = ({ label, deltaLabel = "Privy Advantage", children }) => (
  <div className={styles.benchmarkPairTable} role="table" aria-label={label}>
    <div className={styles.benchmarkPairHeader} role="row">
      <span role="columnheader">Metric</span>
      <span
        className={classNames(
          styles.benchmarkTransportHeader,
          toneClass("privy")
        )}
        role="columnheader"
      >
        Privy
      </span>
      <span
        className={classNames(
          styles.benchmarkTransportHeader,
          toneClass("livy")
        )}
        role="columnheader"
      >
        HC Livy
      </span>
      <span role="columnheader">{deltaLabel}</span>
    </div>
    {children}
  </div>
)

PairTable.propTypes = {
  label: PropTypes.string.isRequired,
  deltaLabel: PropTypes.string,
  children: PropTypes.node.isRequired,
}

const PairMetricRow = ({
  label,
  note,
  privy,
  livy,
  formatValue,
  delta,
  maximum = Math.max(privy, livy, 1),
  scale = "linear",
  privyDetail,
  livyDetail,
  impact = 0,
}) => (
  <div className={styles.benchmarkPairRow} role="row" tabIndex="0">
    <span className={styles.benchmarkMetricLabel} role="rowheader">
      {label}
      {note && <small>{note}</small>}
    </span>
    <MetricBarCell
      value={privy}
      maximum={maximum}
      formatValue={formatValue}
      transport="privy"
      detail={privyDetail}
      scale={scale}
      cellRole="cell"
    />
    <MetricBarCell
      value={livy}
      maximum={maximum}
      formatValue={formatValue}
      transport="livy"
      detail={livyDetail}
      scale={scale}
      cellRole="cell"
    />
    <span
      className={classNames(
        styles.benchmarkDelta,
        impact > 1 && styles.benchmarkDeltaPositive
      )}
      role="cell"
    >
      {impact > 1 && (
        <span
          className={styles.benchmarkDeltaShade}
          style={{
            width: `${Math.min(100, (Math.log10(impact) / 2) * 100)}%`,
            opacity: Math.min(0.24, 0.08 + Math.log10(impact) * 0.08),
          }}
          aria-hidden="true"
        />
      )}
      <span className={styles.benchmarkDeltaText}>{delta}</span>
    </span>
  </div>
)

PairMetricRow.propTypes = {
  label: PropTypes.string.isRequired,
  note: PropTypes.string,
  privy: PropTypes.number.isRequired,
  livy: PropTypes.number.isRequired,
  formatValue: PropTypes.func.isRequired,
  delta: PropTypes.string.isRequired,
  maximum: PropTypes.number,
  scale: PropTypes.oneOf(["linear", "log"]),
  privyDetail: PropTypes.string,
  livyDetail: PropTypes.string,
  impact: PropTypes.number,
}

const SingleMetricRow = ({
  label,
  note,
  value,
  maximum,
  transport,
  formatValue,
}) => (
  <div className={styles.benchmarkSingleRow} tabIndex="0">
    <span className={styles.benchmarkMetricLabel}>
      {label}
      {note && <small>{note}</small>}
    </span>
    <MetricBarCell
      value={value}
      maximum={maximum}
      transport={transport}
      formatValue={formatValue}
    />
  </div>
)

SingleMetricRow.propTypes = {
  label: PropTypes.string.isRequired,
  note: PropTypes.string,
  value: PropTypes.number.isRequired,
  maximum: PropTypes.number.isRequired,
  transport: PropTypes.oneOf(["privy", "livy"]).isRequired,
  formatValue: PropTypes.func.isRequired,
}

const BenchmarkSection = ({ id, title, guidance, note, children }) => (
  <section className={styles.benchmarkSection} aria-labelledby={id}>
    <div className={styles.benchmarkSectionHeader}>
      <div>
        <h3 id={id}>{title}</h3>
        {guidance && (
          <em className={styles.benchmarkSectionGuidance}>{guidance}</em>
        )}
      </div>
      {note && <p>{note}</p>}
    </div>
    {children}
  </section>
)

BenchmarkSection.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  guidance: PropTypes.string,
  note: PropTypes.string,
  children: PropTypes.node.isRequired,
}

const latencyAdvantage = (privy, livy) => {
  if (privy === livy) return "Same"
  return livy > privy
    ? `${formatBenchmarkMultiplier(livy / privy)} Lower`
    : `${formatBenchmarkMultiplier(privy / livy)} Higher`
}

const fewerCalls = (privy, livy) => {
  if (privy === livy) return "Same"
  if (privy === 0) return `${formatBenchmarkCount(livy)} Avoided`
  return livy > privy
    ? `${formatBenchmarkMultiplier(livy / privy)} Fewer`
    : `${formatBenchmarkMultiplier(privy / livy)} More`
}

const lowerIsBetterImpact = (privy, livy) => {
  if (livy <= privy) return 0
  return privy === 0 ? 100 : livy / privy
}

const outcomeFormat = kind => {
  if (kind === "decimal") return formatBenchmarkDecimal
  return formatBenchmarkCount
}

const BenchmarkContent = ({ model, idPrefix }) => {
  const { summaries, comparisons, metadata } = model
  const kpis = [
    {
      key: "p50",
      label: "E2E P50",
      privy: summaries.privy.e2e.p50,
      livy: summaries.livy.e2e.p50,
      formatValue: formatBenchmarkMilliseconds,
      delta: `${formatBenchmarkMultiplier(comparisons.p50)} Lower`,
      impact: comparisons.p50,
    },
    {
      key: "p95",
      label: "E2E P95",
      privy: summaries.privy.e2e.p95,
      livy: summaries.livy.e2e.p95,
      formatValue: formatBenchmarkMilliseconds,
      delta: `${formatBenchmarkMultiplier(comparisons.p95)} Lower`,
      impact: comparisons.p95,
    },
    {
      key: "p99",
      label: "E2E P99",
      privy: summaries.privy.e2e.p99,
      livy: summaries.livy.e2e.p99,
      formatValue: formatBenchmarkMilliseconds,
      delta: `${formatBenchmarkMultiplier(comparisons.p99)} Lower`,
      impact: comparisons.p99,
    },
    {
      key: "throughput",
      label: "Effective Throughput",
      privy: summaries.privy.throughputQps,
      livy: summaries.livy.throughputQps,
      formatValue: formatBenchmarkThroughput,
      delta: `${formatBenchmarkMultiplier(comparisons.throughput)} Higher`,
      impact: comparisons.throughput,
    },
    {
      key: "success",
      label: "Success Rate",
      privy: summaries.privy.successRatePct,
      livy: summaries.livy.successRatePct,
      formatValue: formatBenchmarkPercent,
      delta: `${summaries.privy.failureCount} vs ${summaries.livy.failureCount} Failed`,
    },
  ]

  return (
    <>
      <ul className={styles.benchmarkContext} aria-label="Benchmark setup">
        <li>
          {formatBenchmarkCount(metadata.queryCountPerTransport)} Queries /
          Transport
        </li>
        <li>
          {metadata.blockCount} Alternating Blocks x{" "}
          {formatBenchmarkCount(metadata.queriesPerBlock)}
        </li>
        <li>Max {metadata.maxConcurrency} In Flight</li>
        <li>Warmed + Reused Sessions</li>
        <li>HC Livy Poll {metadata.livyPollIntervalMs} ms</li>
      </ul>

      <BenchmarkSection
        id={`${idPrefix}-headline`}
        title="Transport Latency and Throughput"
        guidance="Lower latency and higher throughput are better, higher queries/second is better."
        note="Successful logical queries"
      >
        <PairTable label="Headline Privy and HC Livy transport metrics">
          {kpis.map(kpi => (
            <PairMetricRow key={kpi.key} {...kpi} />
          ))}
        </PairTable>
      </BenchmarkSection>

      <BenchmarkSection
        id={`${idPrefix}-distribution`}
        title="E2E Query Response Distribution"
        guidance="Lower is better."
        note="Local Spark would be slightly faster than Privy as it's completely syncrhonous"
      >
        <PairTable label="End-to-end latency percentile comparison">
          {model.latency.map(point => (
            <PairMetricRow
              key={point.percentile}
              label={`P${point.percentile}`}
              privy={point.privy}
              livy={point.livy}
              maximum={summaries.livy.e2e.max}
              scale="log"
              formatValue={formatBenchmarkMilliseconds}
              delta={latencyAdvantage(point.privy, point.livy)}
              impact={lowerIsBetterImpact(point.privy, point.livy)}
            />
          ))}
        </PairTable>
      </BenchmarkSection>

      <BenchmarkSection
        id={`${idPrefix}-phases`}
        title="Average Time by Measured Method / Phase"
        guidance="Lower is better."
        note="Average milliseconds per successful logical query"
      >
        <div className={styles.benchmarkPhaseGrid}>
          {["privy", "livy"].map(transport => (
            <div
              className={classNames(
                styles.benchmarkPhaseGroup,
                toneClass(transport)
              )}
              key={transport}
            >
              <h4>
                <span aria-hidden="true" />
                {LIVY_PRIVY_TRANSPORT_LABELS[transport]}
              </h4>
              {model.phases[transport].map(phase => (
                <SingleMetricRow
                  key={phase.key}
                  label={phase.label}
                  value={phase.value}
                  maximum={model.phaseMaximum}
                  transport={transport}
                  formatValue={formatBenchmarkMilliseconds}
                />
              ))}
            </div>
          ))}
        </div>
      </BenchmarkSection>

      <BenchmarkSection
        id={`${idPrefix}-outcomes`}
        title="Outcomes, Retries, and HTTP Call Amplification"
        guidance="Lower is better, except for logical successes."
        note="Privy uses Azure Relay which does not suffer from Retry-After"
      >
        <PairTable
          label="Outcome, retry, and HTTP call comparison"
          deltaLabel="Privy Advantage"
        >
          {model.outcomeRows.map(row => (
            <PairMetricRow
              key={row.key}
              label={row.label}
              privy={row.privy}
              livy={row.livy}
              privyDetail={row.privyDetail}
              livyDetail={row.livyDetail}
              formatValue={outcomeFormat(row.format)}
              delta={fewerCalls(row.privy, row.livy)}
              impact={lowerIsBetterImpact(row.privy, row.livy)}
            />
          ))}
        </PairTable>
      </BenchmarkSection>

      <p className={styles.benchmarkFootnote}>
        Privy remote execution is server-reported. HC Livy does not expose
        server execution separately, so it remains inside the submit/poll cycle.
        Latency excludes failed logical queries; both transports completed every
        query.
      </p>
    </>
  )
}

BenchmarkContent.propTypes = {
  model: PropTypes.object.isRequired,
  idPrefix: PropTypes.string.isRequired,
}

const isAbortError = error => error && error.name === "AbortError"

const LivyPrivyBenchmark = ({
  dataSource,
  idPrefix = "livy-privy-benchmark",
}) => {
  const ownedSource = React.useRef(null)
  if (!dataSource && !ownedSource.current) {
    ownedSource.current = new LivyPrivyDataSource()
  }
  const source = dataSource || ownedSource.current
  const [model, setModel] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    source
      .loadVisualRows({ signal: controller.signal })
      .then(rows => {
        if (controller.signal.aborted) return
        setModel(buildLivyPrivyBenchmarkModel(rows))
      })
      .catch(loadError => {
        if (!isAbortError(loadError)) {
          setModel(null)
          setError(loadError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [source])

  React.useEffect(
    () => () => {
      if (!dataSource && ownedSource.current) ownedSource.current.destroy()
    },
    [dataSource]
  )

  return (
    <figure className={styles.transportBenchmark}>
      <figcaption className={styles.visuallyHidden}>
        Privy versus HC Livy Fabric Lakehouse transport benchmark
      </figcaption>

      <div className={styles.benchmarkIntro}>
        <div>
          <h2>Privy vs HC Livy ~ dbt orchestration protocol</h2>
          <p>
            {model
              ? `${model.query}`
              : "N/A"}
          </p>
        </div>
        <div className={styles.benchmarkSummary}>
          <strong>
            {model
              ? formatBenchmarkMultiplier(model.comparisons.throughput)
              : "--"}
          </strong>
          <span>Effective Throughput</span>
        </div>
      </div>

      {loading && (
        <div className={styles.benchmarkState} role="status">
          loading transport benchmark...
        </div>
      )}
      {error && (
        <div className={styles.dashboardError} role="alert">
          data unavailable: {error}
        </div>
      )}
      {model && <BenchmarkContent model={model} idPrefix={idPrefix} />}
    </figure>
  )
}

LivyPrivyBenchmark.propTypes = {
  dataSource: PropTypes.shape({
    loadVisualRows: PropTypes.func.isRequired,
    destroy: PropTypes.func,
  }),
  idPrefix: PropTypes.string,
}

export default LivyPrivyBenchmark
