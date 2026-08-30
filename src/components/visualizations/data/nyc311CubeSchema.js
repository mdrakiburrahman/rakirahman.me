export const NYC311_CUBE_URL =
  "https://rakirahman.blob.core.windows.net/data/nyc311/nyc311-cube-v15.parquet"

export const NYC311_CUBE_BYTE_LENGTH = 39759867

export const ALL_TIME_GROUPING_SET = 0
export const WEEKLY_GROUPING_SET = 1
export const YEARLY_GROUPING_SET = 2

export const DASHBOARD_DIMENSIONS = [
  {
    key: "agency",
    title: "by agency",
    bit: 8,
    maxRows: 12,
    minHeight: 390,
  },
  {
    key: "complaint",
    title: "by complaint type",
    bit: 4,
    maxRows: 12,
    minHeight: 390,
  },
  {
    key: "borough",
    title: "by borough",
    bit: 2,
    maxRows: 6,
    minHeight: 210,
  },
  {
    key: "channel",
    title: "by channel",
    bit: 1,
    maxRows: 5,
    minHeight: 172,
  },
]

export const DAILY_GROUPING_SET_BY_MASK = [
  3,
  4,
  5,
  8,
  6,
  9,
  10,
  14,
  7,
  11,
  12,
  15,
  13,
  16,
  17,
  18,
]

const groupingSetStats = [
  {
    id: ALL_TIME_GROUPING_SET,
    name: "all time",
    description: "read when no date range is brushed",
    rows: 4794,
    kb: 103,
    rowGroups: 1,
    tone: "total",
  },
  {
    id: WEEKLY_GROUPING_SET,
    name: "by week",
    description: "read when brushed: the leftover weeks at the range's edges",
    rows: 796645,
    kb: 1368,
    rowGroups: 16,
    tone: "total",
  },
  {
    id: YEARLY_GROUPING_SET,
    name: "by ISO year",
    description: "read when brushed: the whole years in the range's middle",
    rows: 29680,
    kb: 272,
    rowGroups: 2,
    tone: "total",
  },
  {
    id: 3,
    name: "daily totals",
    rows: 5006,
    kb: 171,
    rowGroups: 1,
    tone: "depth0",
  },
  {
    id: 4,
    name: "channel",
    rows: 22694,
    kb: 171,
    rowGroups: 1,
    tone: "depth1",
  },
  {
    id: 5,
    name: "borough",
    rows: 30032,
    kb: 330,
    rowGroups: 2,
    tone: "depth1",
  },
  {
    id: 6,
    name: "complaint",
    rows: 635575,
    kb: 1565,
    rowGroups: 13,
    tone: "depth1",
  },
  {
    id: 7,
    name: "agency",
    rows: 82036,
    kb: 383,
    rowGroups: 3,
    tone: "depth1",
  },
  {
    id: 8,
    name: "borough + channel",
    rows: 127713,
    kb: 401,
    rowGroups: 3,
    tone: "depth2",
  },
  {
    id: 9,
    name: "complaint + channel",
    rows: 1090675,
    kb: 2638,
    rowGroups: 23,
    tone: "depth2",
  },
  {
    id: 10,
    name: "complaint + borough",
    rows: 2107281,
    kb: 4605,
    rowGroups: 42,
    tone: "depth2",
  },
  {
    id: 11,
    name: "agency + channel",
    rows: 198027,
    kb: 640,
    rowGroups: 5,
    tone: "depth2",
  },
  {
    id: 12,
    name: "agency + borough",
    rows: 358512,
    kb: 997,
    rowGroups: 8,
    tone: "depth2",
  },
  {
    id: 13,
    name: "agency + complaint",
    rows: 642976,
    kb: 1547,
    rowGroups: 13,
    tone: "depth2",
  },
  {
    id: 14,
    name: "complaint + borough + channel",
    rows: 3264874,
    kb: 7002,
    rowGroups: 65,
    tone: "depth3",
  },
  {
    id: 15,
    name: "agency + borough + channel",
    rows: 803982,
    kb: 1959,
    rowGroups: 17,
    tone: "depth3",
  },
  {
    id: 16,
    name: "agency + complaint + channel",
    rows: 1096772,
    kb: 2479,
    rowGroups: 22,
    tone: "depth3",
  },
  {
    id: 17,
    name: "agency + complaint + borough",
    rows: 2118277,
    kb: 4715,
    rowGroups: 43,
    tone: "depth3",
  },
  {
    id: 18,
    name: "agency + complaint + borough + channel",
    rows: 3273554,
    kb: 6771,
    rowGroups: 64,
    tone: "depth4",
  },
]

export const GROUPING_SET_STATS = groupingSetStats.reduce(
  (stats, groupingSet) => ({
    ...stats,
    [groupingSet.id]: groupingSet,
  }),
  {}
)

const groupingSet = id => GROUPING_SET_STATS[id]

export const GROUPING_SET_GROUPS = [
  {
    id: "totals",
    label: "totals",
    note: 'feed the "requests in view" total and the four leaderboards',
    tone: "total",
    items: [groupingSet(0), groupingSet(1), groupingSet(2)],
  },
  {
    id: "daily-none",
    label: "daily · no dimensions",
    note: "draws the line chart when no filters are active",
    tone: "depth0",
    items: [groupingSet(3)],
  },
  {
    id: "daily-one",
    label: "daily · one dimension",
    note: "draws the line chart when one filter is active",
    tone: "depth1",
    items: [groupingSet(4), groupingSet(5), groupingSet(6), groupingSet(7)],
  },
  {
    id: "daily-two",
    label: "daily · two dimensions",
    note: "draws the line chart when two filters are active",
    tone: "depth2",
    items: [
      groupingSet(8),
      groupingSet(9),
      groupingSet(10),
      groupingSet(11),
      groupingSet(12),
      groupingSet(13),
    ],
  },
  {
    id: "daily-three",
    label: "daily · three dimensions",
    note: "draws the line chart when three filters are active",
    tone: "depth3",
    items: [groupingSet(14), groupingSet(15), groupingSet(16), groupingSet(17)],
  },
  {
    id: "daily-four",
    label: "daily · all four dimensions",
    note: "draws the line chart when all four filters are active",
    tone: "depth4",
    items: [groupingSet(18)],
  },
]

export const FOOTER_STATS = {
  id: "footer",
  name: "footer · the index",
  description:
    "byte ranges and min/max statistics for every section; read first, once",
  rows: null,
  kb: 195,
  rowGroups: null,
  tone: "footer",
}

export const EMPTY_FILTERS = DASHBOARD_DIMENSIONS.reduce(
  (filters, dimension) => ({
    ...filters,
    [dimension.key]: null,
  }),
  {}
)

const DAY_IN_MS = 24 * 60 * 60 * 1000

const startOfIsoWeek = timestamp => {
  const daysSinceEpoch = Math.floor(timestamp / DAY_IN_MS)
  return timestamp - ((daysSinceEpoch + 3) % 7) * DAY_IN_MS
}

const startOfIsoYear = year => startOfIsoWeek(Date.UTC(year, 0, 4))

export const getGroupingSetMask = filters =>
  DASHBOARD_DIMENSIONS.reduce((mask, dimension) => {
    const selected = filters[dimension.key]
    return mask | (selected && selected.length ? dimension.bit : 0)
  }, 0)

export const getDailyGroupingSet = filters =>
  DAILY_GROUPING_SET_BY_MASK[getGroupingSetMask(filters)]

export const getActiveFilters = filters =>
  DASHBOARD_DIMENSIONS.reduce((active, dimension) => {
    const selected = filters[dimension.key] || []
    return [
      ...active,
      ...selected.map(value => ({
        dimension: dimension.key,
        label: dimension.title.replace(/^by /, ""),
        value,
      })),
    ]
  }, [])

export const getRangeSegments = (start, endExclusive) => {
  const startYear = new Date(start).getUTCFullYear()
  const endYear = new Date(endExclusive).getUTCFullYear()
  const yearBoundaries = []

  for (let year = startYear - 1; year <= endYear + 2; year += 1) {
    const boundary = startOfIsoYear(year)
    if (boundary >= start && boundary <= endExclusive) {
      yearBoundaries.push(boundary)
    }
  }

  if (yearBoundaries.length < 2) {
    return [
      {
        groupingSet: WEEKLY_GROUPING_SET,
        start,
        endExclusive,
      },
    ]
  }

  const firstYear = yearBoundaries[0]
  const lastYear = yearBoundaries[yearBoundaries.length - 1]

  return [
    {
      groupingSet: WEEKLY_GROUPING_SET,
      start,
      endExclusive: firstYear,
    },
    {
      groupingSet: YEARLY_GROUPING_SET,
      start: firstYear,
      endExclusive: lastYear,
    },
    {
      groupingSet: WEEKLY_GROUPING_SET,
      start: lastYear,
      endExclusive,
    },
  ].filter(segment => segment.start < segment.endExclusive)
}

export const addUtcDays = (timestamp, days) => timestamp + days * DAY_IN_MS

export const formatIsoDate = value => new Date(value).toISOString().slice(0, 10)
