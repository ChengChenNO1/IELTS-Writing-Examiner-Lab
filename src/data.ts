import { Task1VisualSpec } from "./task1/types";

export type TopicView = {
  side: string;
  claimZh?: string;
  claimEn?: string;
  analysisZh?: string;
  analysisEn?: string;
};

export type Topic = {
  id: string;
  label: string;
  prompt: string;
  task: "task1" | "task2";
  type:
    | "line graph"
    | "bar chart"
    | "pie chart"
    | "table"
    | "map"
    | "process"
    | "opinion"
    | "discussion"
    | "advantages"
    | "problem-solution";
  keywords: string[];
  source?: "built-in" | "custom" | "external" | "yanyihann";
  visual?: Task1VisualSpec;
  imageUrl?: string;
  sourceUrl?: string;
  year?: number | null;
  examDate?: string | null;
  topicCategory?: string;
  promptZh?: string;
  variant?: string | null;
  views?: TopicView[];
};

export const topics: Topic[] = [
  {
    id: "task1-line-energy",
    label: "Energy use trends",
    task: "task1",
    type: "line graph",
    prompt:
      "The line graph shows the amount of energy produced from coal, natural gas and renewable sources in a country between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    keywords: ["line", "graph", "energy", "coal", "natural", "gas", "renewable", "2000", "2020"]
  },
  {
    id: "task1-bar-commute",
    label: "Commuting methods",
    task: "task1",
    type: "bar chart",
    prompt:
      "The bar chart compares the percentage of commuters using cars, buses, trains and bicycles in three cities in 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    keywords: ["bar", "chart", "commuters", "cars", "buses", "trains", "bicycles", "cities"]
  },
  {
    id: "task1-pie-spending",
    label: "Household spending",
    task: "task1",
    type: "pie chart",
    prompt:
      "The pie charts show how household spending was divided among housing, food, transport, education and leisure in 1995 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    keywords: ["pie", "charts", "household", "spending", "housing", "food", "transport", "education", "leisure"]
  },
  {
    id: "task1-table-university",
    label: "University enrolment",
    task: "task1",
    type: "table",
    prompt:
      "The table gives information about the number of local and international students enrolled in four university faculties from 2015 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    keywords: ["table", "students", "local", "international", "university", "faculties", "2015", "2022"]
  },
  {
    id: "task1-map-library",
    label: "Library redevelopment",
    task: "task1",
    type: "map",
    prompt:
      "The maps show changes to a public library before and after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    keywords: ["maps", "library", "before", "after", "redevelopment", "changes", "public"]
  },
  {
    id: "task1-process-recycling",
    label: "Glass recycling",
    task: "task1",
    type: "process",
    prompt:
      "The diagram illustrates the process used to recycle glass bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    keywords: ["diagram", "process", "recycle", "glass", "bottles", "stages"]
  },
  {
    id: "ai-education",
    label: "AI in education",
    task: "task2",
    type: "opinion",
    prompt:
      "Some people think artificial intelligence will improve education, while others believe it will create serious problems for students. Discuss both views and give your own opinion.",
    keywords: ["artificial", "intelligence", "education", "students", "teachers", "learning"]
  },
  {
    id: "public-transport",
    label: "Public transport",
    task: "task2",
    type: "advantages",
    prompt:
      "In many cities, governments are investing more money in public transport than in roads. Do the advantages of this outweigh the disadvantages?",
    keywords: ["cities", "governments", "public", "transport", "roads", "advantages", "disadvantages"]
  },
  {
    id: "remote-work",
    label: "Remote work",
    task: "task2",
    type: "opinion",
    prompt:
      "More employees are working from home instead of travelling to an office. To what extent do you think this is a positive development?",
    keywords: ["employees", "working", "home", "office", "positive", "development"]
  },
  {
    id: "fast-fashion",
    label: "Fast fashion",
    task: "task2",
    type: "problem-solution",
    prompt:
      "Fast fashion has become increasingly popular, but it can damage the environment and encourage waste. What problems does this cause, and what solutions can you suggest?",
    keywords: ["fast", "fashion", "environment", "waste", "problems", "solutions"]
  },
  {
    id: "screen-time",
    label: "Children and screens",
    task: "task2",
    type: "problem-solution",
    prompt:
      "Many children spend a large amount of time using phones and tablets. What problems can this cause, and what measures could reduce these problems?",
    keywords: ["children", "phones", "tablets", "problems", "measures", "screen"]
  },
  {
    id: "tourism-culture",
    label: "Tourism and culture",
    task: "task2",
    type: "discussion",
    prompt:
      "Some people believe international tourism helps people understand other cultures, while others think it damages local traditions. Discuss both views and give your own opinion.",
    keywords: ["international", "tourism", "cultures", "local", "traditions", "opinion"]
  },
  {
    id: "university-practical",
    label: "University subjects",
    task: "task2",
    type: "opinion",
    prompt:
      "Some people think universities should focus on practical skills for employment, while others believe academic subjects are more important. Discuss both views and give your own opinion.",
    keywords: ["universities", "practical", "skills", "employment", "academic", "subjects"]
  }
];

export const rubric = {
  TR: {
    9: "Prompt explored in depth; clear fully developed position; ideas relevant, fully extended and well supported.",
    8: "Prompt appropriately and sufficiently addressed; clear well-developed position; ideas relevant, well extended and supported.",
    7: "Main parts addressed; clear developed position; ideas extended and supported but may over-generalise or lack focus.",
    6: "Main parts addressed; relevant position; some ideas or evidence may be insufficiently developed, unclear, or inadequate.",
    5: "Main parts incompletely addressed; position present but development is not always clear; ideas limited or repetitive.",
    4: "Prompt tackled minimally or tangentially; position hard to find; main ideas lack relevance, clarity, or support."
  },
  CC: {
    9: "Message followed effortlessly; cohesion rarely attracts attention; paragraphing skilfully managed.",
    8: "Ideas logically sequenced; cohesion well managed; occasional lapses only; paragraphing sufficient and appropriate.",
    7: "Logical organisation and clear progression; cohesive devices used flexibly with some inaccuracies or over/under use.",
    6: "Generally coherent with clear overall progression; cohesion may be faulty or mechanical; paragraphing may not always be logical.",
    5: "Organisation evident but not wholly logical; relationship of ideas can be followed but linking lacks fluency.",
    4: "Ideas not arranged coherently; relationships unclear or inadequately marked; no clear progression."
  },
  LR: {
    9: "Full flexibility and precise use; wide range used accurately and appropriately with sophisticated control.",
    8: "Wide resource used fluently and flexibly; uncommon items used skilfully when appropriate.",
    7: "Sufficient resource for flexibility and precision; less common items attempted with awareness of style and collocation.",
    6: "Generally adequate and appropriate; meaning clear despite restricted range or imprecision.",
    5: "Limited but minimally adequate; simple vocabulary may be accurate but range restricts variation.",
    4: "Limited and inadequate or unrelated; basic, repetitive, or formulaic vocabulary may impede meaning."
  },
  GRA: {
    9: "Wide range of structures with full flexibility and control; punctuation and grammar appropriate throughout.",
    8: "Wide range used flexibly and accurately; majority of sentences error-free; occasional non-systematic errors.",
    7: "Variety of complex structures with some flexibility and accuracy; grammar generally well controlled.",
    6: "Mix of simple and complex forms but limited flexibility; errors occur but rarely impede communication.",
    5: "Limited and repetitive range; complex sentences tend to be faulty; errors may cause difficulty.",
    4: "Very limited range; simple sentences predominate; frequent errors may impede meaning."
  }
} as const;

export const calibrationNotes = [
  "Score each criterion independently before calculating the overall band.",
  "Do not reward length, ornate vocabulary, or memorised phrases unless they serve the task naturally.",
  "Require exact textual evidence for each deduction.",
  "Treat weak reasoning, circular examples, and unsupported claims as Task Response limitations.",
  "Use conservative rounding: a polished surface cannot compensate for underdeveloped content."
];

export const examinerPhrases = [
  "addresses the task clearly, though some supporting ideas remain underdeveloped",
  "cohesion is generally managed, but progression is occasionally mechanical",
  "the range of vocabulary is adequate, with some imprecision in word choice",
  "complex structures are attempted, although control is uneven",
  "the position is relevant but would need fuller support for a higher band"
];
