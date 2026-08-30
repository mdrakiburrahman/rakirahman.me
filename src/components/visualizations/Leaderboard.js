import React from "react"
import PropTypes from "prop-types"
import styles from "./visualizations.module.css"

const Leaderboard = ({
  title,
  items,
  selected,
  onSelect,
  maxRows = 12,
  minHeight = 390,
}) => {
  const visibleItems = items.slice(0, maxRows)
  const maximum = visibleItems.length ? visibleItems[0].value : 1

  return (
    <section
      className={styles.leaderboard}
      style={{ minHeight }}
      aria-label={title}
    >
      <h3 className={styles.leaderboardTitle}>{title}</h3>
      {visibleItems.length === 0 && (
        <p className={styles.leaderboardEmpty}>no matching values</p>
      )}
      {visibleItems.map(item => {
        const isSelected = selected.includes(item.key)
        const isDimmed = selected.length > 0 && !isSelected

        return (
          <button
            key={item.key}
            className={`${styles.leaderboardRow} ${
              isDimmed ? styles.leaderboardRowDimmed : ""
            }`}
            type="button"
            title={item.key}
            aria-pressed={isSelected}
            onClick={() => onSelect(item.key)}
          >
            <span
              className={`${styles.leaderboardBar} ${
                isSelected ? styles.leaderboardBarSelected : ""
              }`}
              style={{ width: `${(item.value / maximum) * 100}%` }}
              aria-hidden="true"
            />
            <span
              className={`${styles.leaderboardLabel} ${
                isSelected ? styles.leaderboardTextSelected : ""
              }`}
            >
              {String(item.key).toLowerCase()}
            </span>
            <span
              className={`${styles.leaderboardValue} ${
                isSelected ? styles.leaderboardTextSelected : ""
              }`}
            >
              {item.value.toLocaleString()}
            </span>
          </button>
        )
      })}
    </section>
  )
}

Leaderboard.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  selected: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  maxRows: PropTypes.number,
  minHeight: PropTypes.number,
}

export default React.memo(Leaderboard)
