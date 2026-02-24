import React from "react";

const TRAIN_TAG_MAP = {
  の: { name: "のぞみ", short: "の", color: "#BBBB00", textColor: "dark" },
  ひ: { name: "ひかり", short: "ひ", color: "#FF0000", textColor: "light" },
  こ: { name: "こだま", short: "こ", color: "#0000FF", textColor: "light" },
  み: { name: "みずほ", short: "み", color: "#FFA500", textColor: "dark" },
  さ: { name: "さくら", short: "さ", color: "#FF1493", textColor: "light" },
  つ: { name: "つばめ", short: "つ", color: "#00AAAA", textColor: "light" },
} as const;

type TrainTag = keyof typeof TRAIN_TAG_MAP;

type TrainIconProps = {
  tag: string;
};

export function isTrainTag(tag: string): tag is TrainTag {
  return tag in TRAIN_TAG_MAP;
}

const TrainIcon: React.FC<TrainIconProps> = ({ tag }) => {
  if (!isTrainTag(tag)) {
    return <>{`<${tag}>`}</>;
  }

  const theme = TRAIN_TAG_MAP[tag];
  return (
    <span
      className={`train-icon${theme.textColor === "dark" ? " train-icon--dark" : ""}`}
      style={{ backgroundColor: theme.color }}
      title={theme.name}
      aria-label={theme.name}
    >
      {theme.short}
    </span>
  );
};

export default TrainIcon;
