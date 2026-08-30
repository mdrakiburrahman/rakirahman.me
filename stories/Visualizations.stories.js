import React from "react"
import { withA11y } from "@storybook/addon-a11y"
import {
  GroupingSetDiagram,
  NYC311_CUBE_BYTE_LENGTH,
  Nyc311Dashboard,
} from "../src/components/visualizations"

export default {
  title: "Visualizations",
  decorators: [withA11y],
}

const unavailableDataSource = {
  byteLength: NYC311_CUBE_BYTE_LENGTH,
  subscribe: () => () => {},
  loadInitial: () =>
    Promise.reject(new Error("Example Blob Storage connection failure")),
  loadDailySeries: () => Promise.resolve([]),
  loadRangeRows: () => Promise.resolve([]),
}

export const LiveNyc311Dashboard = _ => (
  <Nyc311Dashboard idPrefix="storybook-dashboard" />
)

export const ParquetGroupingSets = _ => <GroupingSetDiagram />

export const CombinedVisualizations = _ => (
  <>
    <Nyc311Dashboard idPrefix="storybook-combined" />
    <GroupingSetDiagram />
  </>
)

export const DashboardErrorState = _ => (
  <Nyc311Dashboard
    dataSource={unavailableDataSource}
    idPrefix="storybook-error"
  />
)
