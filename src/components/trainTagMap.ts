export const TRAIN_TAG_MAP = {
  の: { name: "のぞみ", short: "の", color: "#BBBB00", textColor: "dark" },
  ひ: { name: "ひかり", short: "ひ", color: "#FF0000", textColor: "light" },
  こ: { name: "こだま", short: "こ", color: "#0000FF", textColor: "light" },
  み: { name: "みずほ", short: "み", color: "#FFA500", textColor: "dark" },
  さ: { name: "さくら", short: "さ", color: "#FF1493", textColor: "light" },
  つ: { name: "つばめ", short: "つ", color: "#00AAAA", textColor: "light" },
} as const;

export type TrainTag = keyof typeof TRAIN_TAG_MAP;

export function isTrainTag(tag: string): tag is TrainTag {
  return tag in TRAIN_TAG_MAP;
}
