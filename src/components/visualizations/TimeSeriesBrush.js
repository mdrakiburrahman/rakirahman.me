import React from "react"
import PropTypes from "prop-types"
import styles from "./visualizations.module.css"

const WIDTH = 940
const HEIGHT = 156
const TOP = 8
const BOTTOM = 6
const DAY_IN_MS = 24 * 60 * 60 * 1000
const WEEK_IN_MS = 7 * DAY_IN_MS

const startOfIsoWeek = timestamp => {
  const daysSinceEpoch = Math.floor(timestamp / DAY_IN_MS)
  return timestamp - ((daysSinceEpoch + 3) % 7) * DAY_IN_MS
}

const startOfUtcDay = timestamp => Math.floor(timestamp / DAY_IN_MS) * DAY_IN_MS

const aggregateByWeek = series => {
  const weeks = new Map()

  series.forEach(point => {
    const week = startOfIsoWeek(point.date)
    weeks.set(week, (weeks.get(week) || 0) + point.value)
  })

  return [...weeks.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((left, right) => left.date - right.date)
}

const buildTicks = (first, last) => {
  const duration = last - first

  if (duration <= 45 * DAY_IN_MS) {
    const ticks = []
    const step = duration <= 18 * DAY_IN_MS ? 2 : 7
    let cursor =
      Date.UTC(
        new Date(first).getUTCFullYear(),
        new Date(first).getUTCMonth(),
        new Date(first).getUTCDate()
      ) +
      step * DAY_IN_MS

    while (cursor < last) {
      ticks.push({
        date: cursor,
        label: new Date(cursor)
          .toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          })
          .toLowerCase(),
      })
      cursor += step * DAY_IN_MS
    }

    return ticks
  }

  if (duration <= 400 * DAY_IN_MS) {
    const ticks = []
    const firstDate = new Date(first)
    let cursor = Date.UTC(
      firstDate.getUTCFullYear(),
      firstDate.getUTCMonth() + 1,
      1
    )
    const monthStep = duration > 220 * DAY_IN_MS ? 2 : 1

    while (cursor < last) {
      ticks.push({
        date: cursor,
        label: new Date(cursor)
          .toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC",
          })
          .toLowerCase(),
      })
      const date = new Date(cursor)
      cursor = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + monthStep,
        1
      )
    }

    return ticks
  }

  const ticks = []
  const firstYear = new Date(first).getUTCFullYear()
  const lastYear = new Date(last).getUTCFullYear()
  const yearStep = lastYear - firstYear > 6 ? 2 : 1

  for (let year = firstYear + 1; year <= lastYear; year += yearStep) {
    ticks.push({ date: Date.UTC(year, 0, 1), label: String(year) })
  }

  return ticks
}

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum)

const formatIsoDate = timestamp =>
  new Date(timestamp).toISOString().slice(0, 10)

const TimeSeriesBrush = ({
  series,
  domain,
  range,
  onRangeChange,
  idPrefix = "parquet-dashboard",
  marker,
  ariaLabel = "Time series. Drag to select whole weeks. Press Escape to clear, or use the arrow keys to move the selected range.",
  chartTitle = "Time series",
  chartDescription = "Timestamped values read from a public Parquet file. Drag horizontally to filter the dashboard.",
  aggregation = "week",
  includeZero = true,
  brushGranularity = "week",
}) => {
  const svgRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const [preview, setPreview] = React.useState(null)

  const chart = React.useMemo(() => {
    const points = aggregation === "week" ? aggregateByWeek(series) : series
    if (!points.length) return null

    const first =
      aggregation === "week"
        ? startOfIsoWeek(domain ? domain[0] : points[0].date)
        : domain
        ? domain[0]
        : points[0].date
    const last =
      aggregation === "week"
        ? startOfIsoWeek(domain ? domain[1] : points[points.length - 1].date) +
          WEEK_IN_MS
        : domain
        ? domain[1]
        : points[points.length - 1].date
    const rawMinimum = Math.min(...points.map(point => point.value))
    const rawMaximum = Math.max(...points.map(point => point.value))
    const rawSpan = Math.max(rawMaximum - rawMinimum, rawMaximum * 0.08, 1)
    const minimum = includeZero ? 0 : Math.max(rawMinimum - rawSpan * 0.12, 0)
    const maximum = rawMaximum + (includeZero ? 0 : rawSpan * 0.12)
    const x = date => ((date - first) / (last - first)) * WIDTH
    const y = value =>
      HEIGHT -
      BOTTOM -
      ((value - minimum) / (maximum - minimum)) * (HEIGHT - TOP - BOTTOM)
    const line = points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${x(point.date).toFixed(1)},${y(
            point.value
          ).toFixed(1)}`
      )
      .join("")
    const area = `${line}L${WIDTH},${HEIGHT - BOTTOM}L0,${HEIGHT - BOTTOM}Z`

    return {
      first,
      last,
      line,
      area,
      ticks: buildTicks(first, last),
      x,
    }
  }, [series, domain, aggregation, includeZero])

  if (!chart) {
    return <div className={styles.chartSkeleton} aria-hidden="true" />
  }

  const { first, last, line, area, ticks, x } = chart
  const timestampAt = chartX =>
    first + (clamp(chartX, 0, WIDTH) / WIDTH) * (last - first)
  const activeRange =
    preview &&
    Math.abs(preview[1] - preview[0]) >=
      (brushGranularity === "day" ? DAY_IN_MS : WEEK_IN_MS)
      ? [Math.min(...preview), Math.max(...preview)]
      : range
  const selection = activeRange
    ? [new Date(activeRange[0]).getTime(), new Date(activeRange[1]).getTime()]
    : null
  const gradientPrimary = `${idPrefix}-primary-gradient`
  const gradientMuted = `${idPrefix}-muted-gradient`
  const clipId = `${idPrefix}-selection-clip`
  const afterMarkerClip = `${idPrefix}-after-marker-clip`
  const markerTimestamp = marker ? new Date(marker.date).getTime() : null
  const markerX =
    markerTimestamp != null && Number.isFinite(markerTimestamp)
      ? clamp(x(markerTimestamp), 0, WIDTH)
      : null
  const markerWidth = marker
    ? Math.max(String(marker.label).length * 6.2 + 18, 72)
    : 0
  const markerLabelX =
    markerX == null
      ? 0
      : clamp(markerX - markerWidth / 2, 4, WIDTH - markerWidth - 4)

  const pointerX = event => {
    const bounds = svgRef.current.getBoundingClientRect()
    return ((event.clientX - bounds.left) / bounds.width) * WIDTH
  }

  const handlePointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const date = timestampAt(pointerX(event))
    dragRef.current = date
    setPreview([date, date])
  }

  const handlePointerMove = event => {
    if (dragRef.current == null) return
    setPreview([dragRef.current, timestampAt(pointerX(event))])
  }

  const finishBrush = () => {
    if (!preview) return
    const start = Math.min(...preview)
    const end = Math.max(...preview)
    dragRef.current = null
    setPreview(null)

    const brushStep = brushGranularity === "day" ? DAY_IN_MS : WEEK_IN_MS
    if (end - start < brushStep) {
      onRangeChange(null)
      return
    }

    const snap = brushGranularity === "day" ? startOfUtcDay : startOfIsoWeek
    const snappedStart = snap(start)
    const endBucket = snap(end)
    const snappedEnd = endBucket === end ? end : endBucket + brushStep

    onRangeChange([formatIsoDate(snappedStart), formatIsoDate(snappedEnd)])
  }

  const cancelBrush = () => {
    dragRef.current = null
    setPreview(null)
  }

  const handleKeyDown = event => {
    if (event.key === "Escape" || event.key === "Delete") {
      event.preventDefault()
      onRangeChange(null)
      return
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const direction = event.key === "ArrowRight" ? 1 : -1
    const brushStep = brushGranularity === "day" ? DAY_IN_MS : WEEK_IN_MS

    if (!selection) {
      const selectedEnd = last
      onRangeChange([
        formatIsoDate(
          selectedEnd -
            (brushGranularity === "day" ? 7 * DAY_IN_MS : 52 * WEEK_IN_MS)
        ),
        formatIsoDate(selectedEnd),
      ])
      return
    }

    const nextStart = clamp(
      selection[0] + direction * brushStep,
      first,
      last - brushStep
    )
    const nextEnd = clamp(
      selection[1] + direction * brushStep,
      nextStart + brushStep,
      last
    )
    onRangeChange([formatIsoDate(nextStart), formatIsoDate(nextEnd)])
  }

  const selectionX = selection ? x(selection[0]) : 0
  const selectionWidth = selection
    ? Math.max(x(selection[1]) - selectionX, 0)
    : WIDTH

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={svgRef}
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        tabIndex="0"
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishBrush}
        onPointerCancel={cancelBrush}
        onKeyDown={handleKeyDown}
      >
        <title>{chartTitle}</title>
        <desc>{chartDescription}</desc>
        <defs>
          <linearGradient id={gradientPrimary} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--viz-accent)"
              stopOpacity="0.16"
            />
            <stop
              offset="100%"
              stopColor="var(--viz-accent)"
              stopOpacity="0.015"
            />
          </linearGradient>
          <linearGradient id={gradientMuted} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--viz-line-muted)"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="var(--viz-line-muted)"
              stopOpacity="0.01"
            />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={selectionX} y="0" width={selectionWidth} height={HEIGHT} />
          </clipPath>
          {markerX != null && (
            <clipPath id={afterMarkerClip}>
              <rect
                x={markerX}
                y="0"
                width={Math.max(WIDTH - markerX, 0)}
                height={HEIGHT}
              />
            </clipPath>
          )}
        </defs>

        {markerX != null && (
          <rect
            className={styles.chartAfterRegion}
            x={markerX}
            y={TOP}
            width={Math.max(WIDTH - markerX, 0)}
            height={HEIGHT - TOP - BOTTOM}
          />
        )}

        <g className={selection ? styles.chartMutedVisible : styles.chartMuted}>
          <path d={area} fill={`url(#${gradientMuted})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--viz-line-muted)"
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </g>

        <g clipPath={`url(#${clipId})`}>
          <path d={area} fill={`url(#${gradientPrimary})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--viz-accent)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </g>

        {markerX != null && (
          <g clipPath={`url(#${afterMarkerClip})`}>
            <path d={area} fill="var(--viz-positive)" fillOpacity="0.09" />
            <path
              d={line}
              fill="none"
              stroke="var(--viz-positive)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </g>
        )}

        {selection && (
          <rect
            x={selectionX}
            y={TOP}
            width={selectionWidth}
            height={HEIGHT - TOP - BOTTOM}
            fill="var(--viz-accent)"
            fillOpacity="0.04"
            stroke="var(--viz-accent)"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        )}

        {markerX != null && (
          <g className={styles.chartMarker} aria-hidden="true">
            <line
              className={styles.chartMarkerLine}
              x1={markerX}
              x2={markerX}
              y1={TOP}
              y2={HEIGHT - BOTTOM}
              vectorEffect="non-scaling-stroke"
            />
            <rect
              className={styles.chartMarkerPill}
              x={markerLabelX}
              y={12}
              width={markerWidth}
              height={20}
              rx={10}
              vectorEffect="non-scaling-stroke"
            />
            <text
              className={styles.chartMarkerLabel}
              x={markerLabelX + markerWidth / 2}
              y={25.5}
              textAnchor="middle"
            >
              {marker.label}
            </text>
          </g>
        )}

        <line
          x1="0"
          x2={WIDTH}
          y1={HEIGHT - BOTTOM}
          y2={HEIGHT - BOTTOM}
          stroke="currentColor"
          strokeOpacity="0.28"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className={styles.chartTicks} aria-hidden="true">
        {ticks.map(tick => (
          <span
            key={tick.date}
            style={{
              left: `${(x(tick.date) / WIDTH) * 100}%`,
            }}
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  )
}

TimeSeriesBrush.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  domain: PropTypes.arrayOf(PropTypes.number),
  range: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onRangeChange: PropTypes.func.isRequired,
  idPrefix: PropTypes.string,
  marker: PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  }),
  ariaLabel: PropTypes.string,
  chartTitle: PropTypes.string,
  chartDescription: PropTypes.string,
  aggregation: PropTypes.oneOf(["week", "none"]),
  includeZero: PropTypes.bool,
  brushGranularity: PropTypes.oneOf(["day", "week"]),
}

export default React.memo(TimeSeriesBrush)
