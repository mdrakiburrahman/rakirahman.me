import React from "react"
import PropTypes from "prop-types"
import styles from "./visualizations.module.css"

const Leaderboard = ({
  title,
  items,
  selected = [],
  onSelect,
  maxRows = 12,
  minHeight = 390,
  formatValue = value => value.toLocaleString(),
  emptyText = "no matching values",
  maxValue,
}) => {
  const visibleItems = items.slice(0, maxRows)
  const maximum =
    maxValue ||
    Math.max(
      ...visibleItems.map(item =>
        Math.abs(item.barValue == null ? item.value : item.barValue)
      ),
      1
    )

  return (
    <section
      className={styles.leaderboard}
      style={{ minHeight }}
      aria-label={title}
    >
      <h3 className={styles.leaderboardTitle}>{title}</h3>
      {visibleItems.length === 0 && (
        <p className={styles.leaderboardEmpty}>{emptyText}</p>
      )}
      {visibleItems.map(item => {
        const isSelected = selected.includes(item.key)
        const isDimmed = selected.length > 0 && !isSelected
        const barValue = Math.abs(
          item.barValue == null ? item.value : item.barValue
        )
        const Row = onSelect ? "button" : "div"

        return (
          <Row
            key={item.key}
            className={`${styles.leaderboardRow} ${
              isDimmed ? styles.leaderboardRowDimmed : ""
            }`}
            {...(onSelect
              ? {
                  type: "button",
                  "aria-pressed": isSelected,
                  onClick: () => onSelect(item.key),
                }
              : {})}
            title={item.label || String(item.key)}
          >
            <span
              className={`${styles.leaderboardBar} ${
                isSelected ? styles.leaderboardBarSelected : ""
              }`}
              style={{ width: `${(barValue / maximum) * 100}%` }}
              aria-hidden="true"
            />
            <span
              className={`${styles.leaderboardLabel} ${
                isSelected ? styles.leaderboardTextSelected : ""
              }`}
            >
              {item.prefix && (
                <span className={styles.leaderboardPrefix}>{item.prefix}</span>
              )}
              {String(item.label == null ? item.key : item.label).toLowerCase()}
            </span>
            <span className={styles.leaderboardValueGroup}>
              <span
                className={`${styles.leaderboardValue} ${
                  isSelected ? styles.leaderboardTextSelected : ""
                } ${
                  item.tone === "positive"
                    ? styles.positiveText
                    : item.tone === "negative"
                    ? styles.negativeText
                    : ""
                }`}
              >
                {formatValue(item.value, item)}
              </span>
              {item.secondary && (
                <span
                  className={`${styles.leaderboardSecondary} ${
                    item.secondaryTone === "positive"
                      ? styles.positiveText
                      : item.secondaryTone === "negative"
                      ? styles.negativeText
                      : ""
                  }`}
                >
                  {item.secondary}
                </span>
              )}
            </span>
          </Row>
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
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      prefix: PropTypes.string,
      value: PropTypes.number.isRequired,
      barValue: PropTypes.number,
      secondary: PropTypes.string,
      tone: PropTypes.oneOf(["positive", "negative"]),
      secondaryTone: PropTypes.oneOf(["positive", "negative"]),
    })
  ).isRequired,
  selected: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onSelect: PropTypes.func,
  maxRows: PropTypes.number,
  minHeight: PropTypes.number,
  formatValue: PropTypes.func,
  emptyText: PropTypes.string,
  maxValue: PropTypes.number,
}

export default React.memo(Leaderboard)
