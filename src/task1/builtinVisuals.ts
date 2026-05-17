import { Task1VisualSpec } from "./types";

export const builtinVisuals: Record<string, Task1VisualSpec> = {
  "task1-line-energy": {
    kind: "line",
    title: "Energy production by source (2000–2020)",
    xLabels: ["2000", "2005", "2010", "2015", "2020"],
    yLabel: "Terawatt hours",
    series: [
      { name: "Coal", color: "#4a5568", values: [210, 198, 175, 142, 118] },
      { name: "Natural gas", color: "#256f5b", values: [95, 102, 110, 118, 125] },
      { name: "Renewables", color: "#80ad72", values: [28, 42, 58, 82, 108] }
    ]
  },
  "task1-bar-commute": {
    kind: "bar",
    title: "Commuting methods in three cities (%)",
    categories: ["Cars", "Buses", "Trains", "Bicycles"],
    yLabel: "Percentage",
    groups: [
      { label: "City A · 2010", values: [52, 18, 22, 8] },
      { label: "City A · 2020", values: [41, 20, 24, 15] },
      { label: "City B · 2010", values: [48, 22, 20, 10] },
      { label: "City B · 2020", values: [38, 24, 26, 12] },
      { label: "City C · 2010", values: [44, 26, 18, 12] },
      { label: "City C · 2020", values: [33, 28, 25, 14] }
    ]
  },
  "task1-pie-spending": {
    kind: "pie",
    title: "Household spending by category",
    pies: [
      {
        year: "1995",
        slices: [
          { label: "Housing", value: 34, color: "#256f5b" },
          { label: "Food", value: 22, color: "#80ad72" },
          { label: "Transport", value: 18, color: "#4a5568" },
          { label: "Education", value: 12, color: "#9bb89a" },
          { label: "Leisure", value: 14, color: "#c9dcc4" }
        ]
      },
      {
        year: "2020",
        slices: [
          { label: "Housing", value: 29, color: "#256f5b" },
          { label: "Food", value: 16, color: "#80ad72" },
          { label: "Transport", value: 21, color: "#4a5568" },
          { label: "Education", value: 17, color: "#9bb89a" },
          { label: "Leisure", value: 17, color: "#c9dcc4" }
        ]
      }
    ]
  },
  "task1-table-university": {
    kind: "table",
    title: "University enrolment by faculty (thousands)",
    headers: ["Faculty", "2015 local", "2015 intl.", "2022 local", "2022 intl."],
    rows: [
      ["Engineering", "4.2", "1.8", "4.6", "2.4"],
      ["Business", "3.5", "2.1", "3.8", "2.9"],
      ["Arts", "2.1", "0.6", "2.0", "0.9"],
      ["Science", "3.0", "1.2", "3.3", "1.7"]
    ]
  },
  "task1-map-library": {
    kind: "map",
    title: "Public library site — before and after redevelopment",
    beforeLabel: "Before",
    afterLabel: "After",
    beforeFeatures: ["Main building", "Car park (north)", "Small garden", "One entrance"],
    afterFeatures: ["Expanded reading wing", "Café & community hall", "Pedestrian plaza", "Cycle parking", "Green roof terrace"]
  },
  "task1-process-recycling": {
    kind: "process",
    title: "Glass bottle recycling process",
    steps: [
      "Collection from households",
      "Sorting by colour",
      "Crushing and cleaning",
      "Melting in furnace",
      "Moulding new bottles",
      "Distribution to retailers"
    ]
  }
};
