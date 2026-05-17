import { builtinVisuals } from "./builtinVisuals";
import { ImageVisual, Task1VisualSpec } from "./types";
import { Topic } from "../data";

export function resolveTask1Visual(topic: Topic): Task1VisualSpec | null {
  if (topic.task !== "task1") return null;

  if (topic.visual) return topic.visual;

  const builtin = builtinVisuals[topic.id];
  if (builtin) return builtin;

  if (topic.imageUrl) {
    const imageVisual: ImageVisual = {
      kind: "image",
      title: topic.label,
      src: topic.imageUrl,
      alt: topic.prompt.slice(0, 120),
      source: topic.sourceUrl
    };
    return imageVisual;
  }

  return null;
}
