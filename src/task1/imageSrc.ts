/** Resolve Task 1 chart image paths (local mirror or remote CDN). */
export function resolveTask1ImageSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${src.replace(/^\//, "")}`;
}
