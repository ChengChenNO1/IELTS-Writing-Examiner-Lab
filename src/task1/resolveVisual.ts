import { builtinVisuals } from "./builtinVisuals";
import { resolveTask1ImageSrc } from "./imageSrc";
import { ImageVisual, Task1VisualSpec } from "./types";
import { Topic } from "../data";

export function resolveTask1Visual(topic: Topic): Task1VisualSpec | null {
  if (topic.task !== "task1") return null;

  if (topic.visual) return topic.visual;

  const builtin = builtinVisuals[topic.id];
  if (builtin) return builtin;

  const src = resolveTask1ImageSrc(topic.imageUrl);
  if (src) {
    const remoteSrc =
      topic.imageRemoteUrl ?? (/^https?:\/\//i.test(topic.imageUrl ?? "") ? topic.imageUrl : undefined);
    const imageVisual: ImageVisual = {
      kind: "image",
      title: topic.label,
      src,
      alt: topic.prompt.slice(0, 120),
      source: topic.sourceUrl,
      remoteSrc
    };
    return imageVisual;
  }

  return null;
}
