// crisp-api joins URL segments without encoding them, so every caller value is encoded here.
export function segment(value: string): string {
  return encodeURIComponent(value);
}

export function treePath(path: string): string {
  return path
    .split("/")
    .filter((part) => part !== "")
    .map(segment)
    .join("/");
}
