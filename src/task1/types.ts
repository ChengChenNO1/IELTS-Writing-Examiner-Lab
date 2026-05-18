export type LineSeries = {
  name: string;
  color: string;
  values: number[];
};

export type LineVisual = {
  kind: "line";
  title: string;
  xLabels: string[];
  yLabel?: string;
  series: LineSeries[];
};

export type BarGroup = {
  label: string;
  values: number[];
};

export type BarVisual = {
  kind: "bar";
  title: string;
  categories: string[];
  groups: BarGroup[];
  yLabel?: string;
};

export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

export type PieVisual = {
  kind: "pie";
  title: string;
  pies: { year: string; slices: PieSlice[] }[];
};

export type TableVisual = {
  kind: "table";
  title: string;
  headers: string[];
  rows: string[][];
};

export type MapVisual = {
  kind: "map";
  title: string;
  beforeLabel: string;
  afterLabel: string;
  beforeFeatures: string[];
  afterFeatures: string[];
};

export type ProcessVisual = {
  kind: "process";
  title: string;
  steps: string[];
};

export type ImageVisual = {
  kind: "image";
  title: string;
  src: string;
  alt: string;
  source?: string;
  remoteSrc?: string;
};

export type Task1VisualSpec =
  | LineVisual
  | BarVisual
  | PieVisual
  | TableVisual
  | MapVisual
  | ProcessVisual
  | ImageVisual;

export type ExternalTask1Topic = {
  id: string;
  label: string;
  type: string;
  prompt: string;
  imageUrl: string;
  source: string;
  keywords: string[];
};

export type Task1Bank = {
  fetchedAt: string;
  source: string;
  topics: ExternalTask1Topic[];
};
