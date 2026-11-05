/** Watercolor inks used for stains, avatars and splashes (mirrors the CSS tokens). */
export const WATERCOLORS = [
  "#ef6fa6", // pink
  "#f7a8c9", // pink wash
  "#5fbfe6", // blue
  "#9fd8f0", // blue wash
  "#f6df4f", // yellow
  "#f4a35a", // orange
  "#c79be6", // lilac
  "#7cc59a", // green
] as const

export type Watercolor = (typeof WATERCOLORS)[number]
