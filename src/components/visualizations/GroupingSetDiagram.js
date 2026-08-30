import React from "react"
import PropTypes from "prop-types"
import styles from "./visualizations.module.css"

const BLOCK_SIZE = 6
const BLOCK_GAP = 1
const BLOCK_COLUMNS = 8
const BLOCK_STACK_WIDTH = BLOCK_COLUMNS * (BLOCK_SIZE + BLOCK_GAP) - BLOCK_GAP
const RAIL_WIDTH = 100
const ITEM_GAP = 4
const GROUP_GAP = 10

const formatRows = value => {
  if (value == null) return "—"
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

const formatSize = value =>
  value >= 1024 ? `${(value / 1024).toFixed(1)}mb` : `${Math.round(value)}kb`

const classNames = (...names) => names.filter(Boolean).join(" ")

const createModel = (groups, footer) => {
  const sections = []
  const ranges = []

  groups.forEach((group, groupIndex) => {
    const start = sections.length

    group.items.forEach((item, itemIndex) => {
      sections.push({
        ...item,
        tone: item.tone || group.tone,
        groupId: group.id,
        groupIndex,
        newGroup: sections.length > 0 && itemIndex === 0,
      })
    })

    ranges.push({
      id: group.id,
      start,
      end: sections.length,
    })
  })

  sections.push({
    ...footer,
    groupId: null,
    groupIndex: null,
    newGroup: true,
    rowGroups: null,
    isFooter: true,
  })

  let stackHeight = 0
  const blocks = sections.map((section, index) => {
    if (index > 0) stackHeight += section.newGroup ? GROUP_GAP : ITEM_GAP

    const rows = section.rowGroups
      ? Math.ceil(section.rowGroups / BLOCK_COLUMNS)
      : 1
    const height = rows * (BLOCK_SIZE + BLOCK_GAP) - BLOCK_GAP
    const block = {
      ...section,
      index,
      y: stackHeight,
      height,
    }
    stackHeight += height
    return block
  })

  const totals = groups.map(group =>
    group.items.reduce(
      (result, item) => ({
        rows: result.rows + (item.rows || 0),
        kb: result.kb + item.kb,
      }),
      { rows: 0, kb: 0 }
    )
  )

  return {
    blocks,
    maximumGroupKb: Math.max(...totals.map(total => total.kb)),
    ranges,
    sections,
    stackHeight,
    totals,
  }
}

const MetricCell = ({ value, percent, tone, active, strong, kind }) => (
  <td
    className={classNames(
      styles.diagramMetricCell,
      kind === "rows" ? styles.diagramRowsCell : styles.diagramSizeCell
    )}
  >
    {kind === "size" && (
      <span
        className={classNames(
          styles.diagramMetricBar,
          styles[tone],
          active && styles.diagramMetricBarActive
        )}
        style={{ width: percent > 0 ? `max(${percent}%, 1px)` : 0 }}
        aria-hidden="true"
      />
    )}
    <span className={strong ? styles.diagramMetricStrong : ""}>
      {kind === "rows" ? formatRows(value) : formatSize(value)}
    </span>
  </td>
)

MetricCell.propTypes = {
  value: PropTypes.number,
  percent: PropTypes.number.isRequired,
  tone: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  strong: PropTypes.bool,
  kind: PropTypes.oneOf(["rows", "size"]).isRequired,
}

const ToneDot = ({ tone }) => (
  <span
    className={classNames(styles.diagramToneDot, styles[tone])}
    aria-hidden="true"
  />
)

ToneDot.propTypes = {
  tone: PropTypes.string.isRequired,
}

const GroupingSetDiagram = ({
  groups,
  footer,
  caption = "The public Parquet layout by grouping set and physical row group",
  title,
  subtitle,
  summaryValue,
  summaryLabel,
  footerNote,
}) => {
  const wrapperRef = React.useRef(null)
  const svgRef = React.useRef(null)
  const sectionRows = React.useRef([])
  const groupRows = React.useRef([])
  const [activeSection, setActiveSection] = React.useState(null)
  const [activeGroup, setActiveGroup] = React.useState(null)
  const [metrics, setMetrics] = React.useState(null)
  const [stickyOffset, setStickyOffset] = React.useState(0)
  const model = React.useMemo(() => createModel(groups, footer), [
    groups,
    footer,
  ])

  const measure = React.useCallback(() => {
    const wrapper = wrapperRef.current
    const firstRow = sectionRows.current[0]
    const lastRow = sectionRows.current[model.sections.length - 1]
    if (!wrapper || !firstRow || !lastRow) return

    const wrapperBounds = wrapper.getBoundingClientRect()
    const firstBodyRow = wrapper.querySelector("tbody tr")
    const firstLabel =
      firstBodyRow && firstBodyRow.querySelector("[data-diagram-label]")
    if (!firstLabel) return
    const firstLabelBounds = firstLabel.getBoundingClientRect()
    const stackTop =
      firstLabelBounds.top +
      firstLabelBounds.height / 2 -
      BLOCK_SIZE / 2 -
      wrapperBounds.top
    const sectionCenters = sectionRows.current.map(row => {
      const bounds = row.getBoundingClientRect()
      return bounds.top - wrapperBounds.top + bounds.height / 2
    })
    const groupCenters = groupRows.current.map(row => {
      if (!row) return null
      const bounds = row.getBoundingClientRect()
      return bounds.top - wrapperBounds.top + bounds.height / 2
    })
    const lastBounds = lastRow.getBoundingClientRect()

    setMetrics({
      groupCenters,
      sectionCenters,
      stackTop,
      railHeight: lastBounds.bottom - wrapperBounds.top - stackTop,
    })
  }, [model.sections.length])

  React.useLayoutEffect(() => {
    measure()
    const wrapper = wrapperRef.current
    if (!wrapper || typeof ResizeObserver === "undefined") return undefined

    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [measure])

  React.useLayoutEffect(() => {
    if ((activeSection == null && activeGroup == null) || !metrics) {
      setStickyOffset(0)
      return undefined
    }

    const updateOffset = () => {
      if (!wrapperRef.current || !svgRef.current) return
      const wrapperTop = wrapperRef.current.getBoundingClientRect().top
      const svgTop = svgRef.current.getBoundingClientRect().top
      const nextOffset = svgTop - wrapperTop - metrics.stackTop
      setStickyOffset(current =>
        Math.abs(current - nextOffset) > 0.5 ? nextOffset : current
      )
    }

    updateOffset()
    window.addEventListener("scroll", updateOffset, { passive: true })
    return () => window.removeEventListener("scroll", updateOffset)
  }, [activeSection, activeGroup, metrics])

  const highlightedGroup =
    activeSection != null
      ? model.sections[activeSection].groupIndex
      : activeGroup

  const activateSection = index => {
    setActiveGroup(null)
    setActiveSection(index)
  }

  const activateGroup = index => {
    setActiveSection(null)
    setActiveGroup(index)
  }

  const clearActive = () => {
    setActiveSection(null)
    setActiveGroup(null)
  }

  const sectionIndex = id =>
    model.sections.findIndex(section => section.id === id)

  const renderItemRow = item => {
    const index = sectionIndex(item.id)
    const section = model.sections[index]
    const active = activeSection === index
    const sizePercent = (100 * section.kb) / model.maximumGroupKb

    return (
      <tr
        key={section.id}
        ref={row => {
          sectionRows.current[index] = row
        }}
        className={classNames(
          styles.diagramSectionRow,
          section.description && styles.diagramDescribedRow,
          active && styles.diagramRowActive
        )}
        data-section-index={index}
        onPointerEnter={() => activateSection(index)}
        onPointerLeave={clearActive}
        onFocus={() => activateSection(index)}
        onBlur={clearActive}
      >
        <td className={styles.diagramSectionCell}>
          <span className={styles.diagramSectionLabelLine}>
            <span className={styles.diagramSectionIndent} aria-hidden="true" />
            <span
              className={classNames(
                styles.diagramSectionLabelText,
                styles.diagramTruncate,
                active && styles.diagramTextActive
              )}
              data-diagram-label
            >
              {section.name}
              <span
                className={classNames(
                  styles.diagramRowGroupCount,
                  active && styles.diagramRowGroupCountVisible
                )}
              >
                {section.rowGroups} row group
                {section.rowGroups === 1 ? "" : "s"}
              </span>
            </span>
          </span>
          {section.description && (
            <span
              className={classNames(
                styles.diagramDescription,
                styles.diagramTruncate
              )}
            >
              {section.description}
            </span>
          )}
        </td>
        <MetricCell
          value={section.rows}
          percent={0}
          tone={section.tone}
          active={active}
          kind="rows"
        />
        <MetricCell
          value={section.kb}
          percent={sizePercent}
          tone={section.tone}
          active={active}
          kind="size"
        />
      </tr>
    )
  }

  return (
    <figure className={styles.groupingDiagram}>
      <figcaption className={styles.visuallyHidden}>{caption}</figcaption>

      {(title || summaryValue) && (
        <div className={styles.diagramIntro}>
          <div>
            {title && <h2 className={styles.diagramTitle}>{title}</h2>}
            {subtitle && <p className={styles.diagramSubtitle}>{subtitle}</p>}
          </div>
          {summaryValue && (
            <div className={styles.diagramSummary}>
              <strong>{summaryValue}</strong>
              {summaryLabel && <span>{summaryLabel}</span>}
            </div>
          )}
        </div>
      )}

      <div className={styles.diagramLayout} ref={wrapperRef}>
        <div className={styles.diagramRowGroupHeader} aria-hidden="true">
          row groups
        </div>

        {metrics && (
          <div
            className={styles.diagramRail}
            style={{
              top: metrics.stackTop,
              height: metrics.railHeight,
            }}
          >
            <svg
              ref={svgRef}
              className={styles.diagramSvg}
              viewBox={`0 0 ${RAIL_WIDTH} ${model.stackHeight}`}
              style={{ height: model.stackHeight }}
              role="group"
              aria-label="Parquet row groups"
            >
              {model.blocks.map((block, index) => {
                const active = activeSection === index
                const dimmed =
                  highlightedGroup != null &&
                  block.groupIndex !== highlightedGroup
                const previous = model.blocks[index - 1]
                const next = model.blocks[index + 1]
                const hoverTop =
                  (block.y +
                    (previous ? previous.y + previous.height : block.y - 8)) /
                  2
                const hoverBottom =
                  (block.y +
                    block.height +
                    (next ? next.y : block.y + block.height + 8)) /
                  2
                const targetY =
                  metrics.sectionCenters[index] -
                  metrics.stackTop -
                  stickyOffset

                return (
                  <g
                    key={block.id}
                    className={dimmed ? styles.diagramBlocksDimmed : ""}
                    role="button"
                    tabIndex="0"
                    aria-label={`${block.name}: ${
                      block.rowGroups == null
                        ? "Parquet footer"
                        : `${block.rowGroups} row group${
                            block.rowGroups === 1 ? "" : "s"
                          }`
                    }`}
                    onPointerEnter={() => activateSection(index)}
                    onPointerLeave={clearActive}
                    onPointerDown={() => activateSection(index)}
                    onFocus={() => activateSection(index)}
                    onBlur={clearActive}
                  >
                    <title>
                      {block.name}
                      {block.rowGroups == null
                        ? ""
                        : `: ${block.rowGroups} row group${
                            block.rowGroups === 1 ? "" : "s"
                          }`}
                    </title>
                    <rect
                      x="-4"
                      y={hoverTop}
                      width={BLOCK_STACK_WIDTH + 8}
                      height={hoverBottom - hoverTop}
                      fill="transparent"
                    />
                    {block.rowGroups == null ? (
                      <rect
                        className={styles[block.tone]}
                        x="0"
                        y={block.y}
                        width={BLOCK_STACK_WIDTH}
                        height={block.height}
                        rx="1"
                        fill="var(--tone)"
                      />
                    ) : (
                      Array.from(
                        { length: block.rowGroups },
                        (_, blockIndex) => (
                          <rect
                            key={blockIndex}
                            className={styles[block.tone]}
                            x={
                              (blockIndex % BLOCK_COLUMNS) *
                              (BLOCK_SIZE + BLOCK_GAP)
                            }
                            y={
                              block.y +
                              Math.floor(blockIndex / BLOCK_COLUMNS) *
                                (BLOCK_SIZE + BLOCK_GAP)
                            }
                            width={BLOCK_SIZE}
                            height={BLOCK_SIZE}
                            rx="1"
                            fill="var(--tone)"
                          />
                        )
                      )
                    )}
                    {active && (
                      <>
                        <rect
                          x="-2"
                          y={block.y - 2}
                          width={BLOCK_STACK_WIDTH + 4}
                          height={block.height + 4}
                          rx="2"
                          fill="none"
                          stroke="var(--viz-ink)"
                          strokeWidth="1.25"
                          vectorEffect="non-scaling-stroke"
                          pointerEvents="none"
                        />
                        <polyline
                          points={`${BLOCK_STACK_WIDTH + 4},${
                            block.y + block.height / 2
                          } 70,${
                            block.y + block.height / 2
                          } 88,${targetY} 98,${targetY}`}
                          fill="none"
                          stroke="var(--viz-ink)"
                          strokeWidth="1.25"
                          vectorEffect="non-scaling-stroke"
                          pointerEvents="none"
                        />
                      </>
                    )}
                  </g>
                )
              })}

              {activeGroup != null &&
                (() => {
                  const range = model.ranges[activeGroup]
                  if (!range || range.end - range.start <= 1) return null
                  const first = model.blocks[range.start]
                  const last = model.blocks[range.end - 1]
                  const center = (first.y + last.y + last.height) / 2
                  const targetY =
                    metrics.groupCenters[activeGroup] -
                    metrics.stackTop -
                    stickyOffset

                  return (
                    <>
                      <rect
                        x="-3.5"
                        y={first.y - 3.5}
                        width={BLOCK_STACK_WIDTH + 7}
                        height={last.y + last.height - first.y + 7}
                        rx="2"
                        fill="none"
                        stroke="var(--viz-ink)"
                        strokeWidth="1.25"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                      <polyline
                        points={`${
                          BLOCK_STACK_WIDTH + 5
                        },${center} 70,${center} 88,${targetY} 98,${targetY}`}
                        fill="none"
                        stroke="var(--viz-ink)"
                        strokeWidth="1.25"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                    </>
                  )
                })()}
            </svg>
          </div>
        )}

        <div className={styles.diagramTableScroll}>
          <table className={styles.diagramTable}>
            <thead>
              <tr>
                <th scope="col">grouping set</th>
                <th className={styles.diagramRowsHeader} scope="col">
                  rows
                </th>
                <th className={styles.diagramSizeHeader} scope="col">
                  size
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, groupIndex) => {
                const total = model.totals[groupIndex]
                const range = model.ranges[groupIndex]
                const singleItem =
                  range && range.end - range.start === 1
                    ? model.sections[range.start]
                    : null
                const singleIndex = singleItem ? range.start : null
                const active = singleItem
                  ? activeSection === singleIndex
                  : activeGroup === groupIndex
                const metric = singleItem || total
                const tone = singleItem ? singleItem.tone : group.tone
                const rowGroupCount =
                  singleItem && singleItem.rowGroups != null
                    ? singleItem.rowGroups
                    : null

                return (
                  <React.Fragment key={group.id}>
                    <tr
                      ref={row => {
                        groupRows.current[groupIndex] = row
                        if (singleItem) {
                          sectionRows.current[singleIndex] = row
                        }
                      }}
                      className={classNames(
                        styles.diagramGroupRow,
                        groupIndex > 0 && styles.diagramGroupRowSeparated,
                        active && styles.diagramRowActive
                      )}
                      data-group-index={groupIndex}
                      data-section-index={singleItem ? singleIndex : undefined}
                      onPointerEnter={() =>
                        singleItem
                          ? activateSection(singleIndex)
                          : activateGroup(groupIndex)
                      }
                      onPointerLeave={clearActive}
                      onFocus={() =>
                        singleItem
                          ? activateSection(singleIndex)
                          : activateGroup(groupIndex)
                      }
                      onBlur={clearActive}
                    >
                      <td className={styles.diagramGroupCell}>
                        <span
                          className={classNames(
                            styles.diagramGroupLabel,
                            styles.diagramTruncate,
                            active && styles.diagramTextActive
                          )}
                          data-diagram-label
                        >
                          <ToneDot tone={group.tone} />
                          {group.label}
                          {rowGroupCount != null && (
                            <span
                              className={classNames(
                                styles.diagramRowGroupCount,
                                active && styles.diagramRowGroupCountVisible
                              )}
                            >
                              {rowGroupCount} row group
                              {rowGroupCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </span>
                        {group.note && (
                          <span
                            className={classNames(
                              styles.diagramGroupNote,
                              styles.diagramTruncate
                            )}
                          >
                            {group.note}
                          </span>
                        )}
                      </td>
                      <MetricCell
                        value={metric.rows}
                        percent={0}
                        tone={tone}
                        active={active}
                        strong
                        kind="rows"
                      />
                      <MetricCell
                        value={metric.kb}
                        percent={(100 * metric.kb) / model.maximumGroupKb}
                        tone={tone}
                        active={active}
                        strong
                        kind="size"
                      />
                    </tr>
                    {!singleItem && group.items.map(renderItemRow)}
                  </React.Fragment>
                )
              })}

              <tr
                ref={row => {
                  sectionRows.current[model.sections.length - 1] = row
                }}
                className={classNames(
                  styles.diagramGroupRow,
                  styles.diagramGroupRowSeparated,
                  styles.diagramFooterRow,
                  activeSection === model.sections.length - 1 &&
                    styles.diagramRowActive
                )}
                data-section-index={model.sections.length - 1}
                onPointerEnter={() =>
                  activateSection(model.sections.length - 1)
                }
                onPointerLeave={clearActive}
                onFocus={() => activateSection(model.sections.length - 1)}
                onBlur={clearActive}
              >
                <td className={styles.diagramGroupCell}>
                  <span
                    className={classNames(
                      styles.diagramGroupLabel,
                      styles.diagramTruncate
                    )}
                    data-diagram-label
                  >
                    <ToneDot tone={footer.tone} />
                    {footer.name}
                  </span>
                  <span
                    className={classNames(
                      styles.diagramGroupNote,
                      styles.diagramTruncate
                    )}
                  >
                    {footer.description}
                  </span>
                </td>
                <MetricCell
                  value={footer.rows}
                  percent={0}
                  tone={footer.tone}
                  active={activeSection === model.sections.length - 1}
                  strong
                  kind="rows"
                />
                <MetricCell
                  value={footer.kb}
                  percent={(100 * footer.kb) / model.maximumGroupKb}
                  tone={footer.tone}
                  active={activeSection === model.sections.length - 1}
                  strong
                  kind="size"
                />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {footerNote && <p className={styles.diagramFooterNote}>{footerNote}</p>}
    </figure>
  )
}

GroupingSetDiagram.propTypes = {
  caption: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  summaryValue: PropTypes.string,
  summaryLabel: PropTypes.string,
  footerNote: PropTypes.string,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      note: PropTypes.string,
      tone: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          name: PropTypes.string.isRequired,
          description: PropTypes.string,
          rows: PropTypes.number.isRequired,
          kb: PropTypes.number.isRequired,
          rowGroups: PropTypes.number.isRequired,
          tone: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  footer: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    rows: PropTypes.number,
    kb: PropTypes.number.isRequired,
    rowGroups: PropTypes.number,
    tone: PropTypes.string.isRequired,
  }).isRequired,
}

export default GroupingSetDiagram
