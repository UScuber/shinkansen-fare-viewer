import type { TrainType } from "./types";

export interface TrainTag {
  id: TrainType;
  name: string;
  color: string;
  textLight: boolean;
  urlAbbr: string;
}

export const TRAIN_TAGS: Record<TrainType, TrainTag> = {
  nozomi: {
    id: "nozomi",
    name: "のぞみ",
    color: "#BBBB00",
    textLight: false,
    urlAbbr: "no",
  },
  hikari: {
    id: "hikari",
    name: "ひかり",
    color: "#FF0000",
    textLight: true,
    urlAbbr: "hi",
  },
  kodama: {
    id: "kodama",
    name: "こだま",
    color: "#0000FF",
    textLight: true,
    urlAbbr: "ko",
  },
  mizuho: {
    id: "mizuho",
    name: "みずほ",
    color: "#FFA500",
    textLight: false,
    urlAbbr: "mi",
  },
  sakura: {
    id: "sakura",
    name: "さくら",
    color: "#FF1493",
    textLight: true,
    urlAbbr: "sa",
  },
  tsubame: {
    id: "tsubame",
    name: "つばめ",
    color: "#00AAAA",
    textLight: true,
    urlAbbr: "ts",
  },
};

/** URL略称→TrainType */
export function trainTypeFromAbbr(abbr: string): TrainType | null {
  const entry = Object.values(TRAIN_TAGS).find((t) => t.urlAbbr === abbr);
  return entry?.id ?? null;
}

/** TrainType→URL略称 */
export function trainTypeToAbbr(t: TrainType): string {
  return TRAIN_TAGS[t].urlAbbr;
}
