import React from "react"
import PropTypes from "prop-types"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Leaderboard from "./Leaderboard"
import RangeTelemetry from "./RangeTelemetry"
import TimeSeriesBrush from "./TimeSeriesBrush"
import styles from "./visualizations.module.css"

const classNames = (...names) => names.filter(Boolean).join(" ")

const ParquetDashboard = ({
  caption,
  title,
  subtitle,
  heroValue,
  heroDetail,
  heroTone = "positive",
  seriesLabel,
  seriesHint,
  seriesDescription,
  series,
  domain,
  range,
  onRangeChange,
  marker,
  seriesAggregation = "week",
  includeZero = true,
  brushGranularity = "week",
  chips = [],
  onClearAll,
  filterHint,
  largeLeaderboards,
  stackedLeaderboards,
  telemetry,
  loading = false,
  error,
  idPrefix = "parquet-dashboard",
}) => {
  const reduceMotion = useReducedMotion()
  const dismissibleChips = chips.filter(chip => chip.onClear)
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 650, damping: 45, mass: 0.7 }

  return (
    <figure className={styles.dashboard}>
      <figcaption className={styles.visuallyHidden}>{caption}</figcaption>

      <div className={styles.dashboardHeader}>
        <div className={styles.dashboardHeading}>
          <h2 className={styles.dashboardTitle}>{title}</h2>
          <div className={styles.dashboardSubtitle}>{subtitle}</div>
        </div>

        <div className={styles.dashboardHero}>
          <div
            className={classNames(
              styles.dashboardHeroValue,
              heroTone === "positive" && styles.positiveText,
              heroTone === "negative" && styles.negativeText,
              loading && styles.loadingValue
            )}
          >
            {heroValue}
          </div>
          <div className={styles.dashboardHeroDetail}>{heroDetail}</div>
        </div>
      </div>

      <div className={styles.chartHeading}>
        <div className={styles.chartLabel}>{seriesLabel}</div>
        {seriesHint && <em className={styles.chartHint}>{seriesHint}</em>}
      </div>
      <TimeSeriesBrush
        series={series}
        domain={domain}
        range={range}
        onRangeChange={onRangeChange}
        marker={marker}
        idPrefix={idPrefix}
        ariaLabel={`${seriesLabel}. Drag to select a date range. Press Escape to clear, or use the arrow keys to move the selected range.`}
        chartTitle={seriesLabel}
        chartDescription={
          seriesDescription ||
          "Values read from public Parquet rows. Drag horizontally to filter the comparison metrics."
        }
        aggregation={seriesAggregation}
        includeZero={includeZero}
        brushGranularity={brushGranularity}
      />

      <div className={styles.dashboardToolbar}>
        <div className={styles.filterBar}>
          {chips.length === 0 && filterHint && (
            <span className={styles.filterHint}>{filterHint}</span>
          )}

          {chips
            .filter(chip => !chip.onClear)
            .map(chip => (
              <span className={styles.filterChip} key={chip.key}>
                {chip.label && (
                  <span className={styles.filterChipLabel}>{chip.label}</span>
                )}
                <span className={styles.filterChipValue}>{chip.value}</span>
              </span>
            ))}

          <AnimatePresence initial={false}>
            {dismissibleChips.map(chip => (
              <motion.button
                key={chip.key}
                className={styles.filterChip}
                type="button"
                layout
                transition={transition}
                initial={{ opacity: 0, x: -10, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                onClick={chip.onClear}
                aria-label={`Clear ${chip.label || chip.value} filter`}
              >
                {chip.label && (
                  <span className={styles.filterChipLabel}>{chip.label}</span>
                )}
                <span className={styles.filterChipValue}>{chip.value}</span>
                <span className={styles.filterChipClose} aria-hidden="true">
                  x
                </span>
              </motion.button>
            ))}

            {dismissibleChips.length > 0 && onClearAll && (
              <motion.button
                key="clear-all"
                className={styles.clearAll}
                type="button"
                layout
                transition={transition}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                onClick={onClearAll}
              >
                clear all
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <RangeTelemetry {...telemetry} loading={loading} />
      </div>

      {error && (
        <div className={styles.dashboardError} role="alert">
          data unavailable: {error}
        </div>
      )}

      <div
        className={classNames(
          styles.leaderboardGrid,
          loading && styles.leaderboardGridLoading
        )}
      >
        {largeLeaderboards.map(leaderboard => (
          <Leaderboard key={leaderboard.title} {...leaderboard} />
        ))}
        <div className={styles.stackedLeaderboards}>
          {stackedLeaderboards.map(leaderboard => (
            <Leaderboard key={leaderboard.title} {...leaderboard} />
          ))}
        </div>
      </div>
    </figure>
  )
}

const leaderboardType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  selected: PropTypes.array,
  onSelect: PropTypes.func,
  maxRows: PropTypes.number,
  minHeight: PropTypes.number,
  formatValue: PropTypes.func,
  emptyText: PropTypes.string,
})

ParquetDashboard.propTypes = {
  caption: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  heroValue: PropTypes.string.isRequired,
  heroDetail: PropTypes.string.isRequired,
  heroTone: PropTypes.oneOf(["positive", "negative", "neutral"]),
  seriesLabel: PropTypes.string.isRequired,
  seriesHint: PropTypes.string,
  seriesDescription: PropTypes.string,
  series: PropTypes.array.isRequired,
  domain: PropTypes.array,
  range: PropTypes.array,
  onRangeChange: PropTypes.func.isRequired,
  marker: PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  }),
  seriesAggregation: PropTypes.oneOf(["week", "none"]),
  includeZero: PropTypes.bool,
  brushGranularity: PropTypes.oneOf(["day", "week"]),
  chips: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      value: PropTypes.string.isRequired,
      onClear: PropTypes.func,
    })
  ),
  onClearAll: PropTypes.func,
  filterHint: PropTypes.string,
  largeLeaderboards: PropTypes.arrayOf(leaderboardType).isRequired,
  stackedLeaderboards: PropTypes.arrayOf(leaderboardType).isRequired,
  telemetry: PropTypes.shape({
    requests: PropTypes.number.isRequired,
    bytes: PropTypes.number.isRequired,
    cacheHits: PropTypes.number.isRequired,
    totalBytes: PropTypes.number.isRequired,
    byteLength: PropTypes.number.isRequired,
    duration: PropTypes.number,
    assetLabel: PropTypes.string,
    rowGroups: PropTypes.number,
  }).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  idPrefix: PropTypes.string,
}

export default ParquetDashboard
