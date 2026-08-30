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

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum)

const formatIsoDate = timestamp =>
  new Date(timestamp).toISOString().slice(0, 10)

const TimeSeriesBrush = ({
  series,
  domain,
  range,
  onRangeChange,
  idPrefix = "nyc311",
}) => {
  const svgRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const [preview, setPreview] = React.useState(null)

  const chart = React.useMemo(() => {
    const weekly = aggregateByWeek(series)
    if (!weekly.length) return null

    const first = startOfIsoWeek(domain ? domain[0] : weekly[0].date)
    const last =
      startOfIsoWeek(domain ? domain[1] : weekly[weekly.length - 1].date) +
      WEEK_IN_MS
    const maximum = Math.max(...weekly.map(point => point.value), 1)
    const x = date => ((date - first) / (last - first)) * WIDTH
    const y = value =>
      HEIGHT - BOTTOM - (value / maximum) * (HEIGHT - TOP - BOTTOM)
    const line = weekly
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${x(point.date).toFixed(1)},${y(
            point.value
          ).toFixed(1)}`
      )
      .join("")
    const area = `${line}L${WIDTH},${HEIGHT - BOTTOM}L0,${HEIGHT - BOTTOM}Z`
    const years = []

    for (
      let year = new Date(first).getUTCFullYear() + 1;
      year <= new Date(last).getUTCFullYear();
      year += 2
    ) {
      years.push(year)
    }

    return {
      first,
      last,
      line,
      area,
      years,
      x,
    }
  }, [series, domain])

  if (!chart) {
    return <div className={styles.chartSkeleton} aria-hidden="true" />
  }

  const { first, last, line, area, years, x } = chart
  const timestampAt = chartX =>
    first + (clamp(chartX, 0, WIDTH) / WIDTH) * (last - first)
  const activeRange =
    preview && Math.abs(preview[1] - preview[0]) >= WEEK_IN_MS
      ? [Math.min(...preview), Math.max(...preview)]
      : range
  const selection = activeRange
    ? [new Date(activeRange[0]).getTime(), new Date(activeRange[1]).getTime()]
    : null
  const gradientPrimary = `${idPrefix}-primary-gradient`
  const gradientMuted = `${idPrefix}-muted-gradient`
  const clipId = `${idPrefix}-selection-clip`

  const pointerX = event => {
    const bounds = svgRef.current.getBoundingClientRect()
    return ((event.clientX - bounds.left) / bounds.width) * WIDTH
  }

  const handlePointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch (_) {}
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

    if (end - start < WEEK_IN_MS) {
      onRangeChange(null)
      return
    }

    const snappedStart = startOfIsoWeek(start)
    const endWeek = startOfIsoWeek(end)
    const snappedEnd = endWeek === end ? end : endWeek + WEEK_IN_MS

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

    if (!selection) {
      const selectedEnd = last
      onRangeChange([
        formatIsoDate(selectedEnd - 52 * WEEK_IN_MS),
        formatIsoDate(selectedEnd),
      ])
      return
    }

    const nextStart = clamp(
      selection[0] + direction * WEEK_IN_MS,
      first,
      last - WEEK_IN_MS
    )
    const nextEnd = clamp(
      selection[1] + direction * WEEK_IN_MS,
      nextStart + WEEK_IN_MS,
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
        aria-label="NYC 311 requests over time. Drag to select whole weeks. Press Escape to clear, or use the arrow keys to move the selected range."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishBrush}
        onPointerCancel={cancelBrush}
        onKeyDown={handleKeyDown}
      >
        <title>NYC 311 requests over time</title>
        <desc>
          Weekly totals derived from daily rows in the Parquet cube. Drag
          horizontally to filter the leaderboards.
        </desc>
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
        </defs>

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

      <div className={styles.yearTicks} aria-hidden="true">
        {years.map(year => (
          <span
            key={year}
            style={{
              left: `${(x(Date.UTC(year, 0, 1)) / WIDTH) * 100}%`,
            }}
          >
            {year}
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
}

export default React.memo(TimeSeriesBrush)
