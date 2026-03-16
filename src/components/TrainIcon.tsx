import type { TrainType } from "../data/types";
import { TRAIN_TAGS } from "../data/trainTags";

interface TrainIconProps {
  trainType: TrainType;
}

export default function TrainIcon({ trainType }: TrainIconProps) {
  const tag = TRAIN_TAGS[trainType];
  const initial = tag.name.charAt(0);
  return (
    <span
      className="mr-0.5 inline-flex size-[22px] items-center justify-center rounded align-middle text-[0.7rem] font-bold"
      style={{
        backgroundColor: tag.color,
        color: tag.textLight ? "#fff" : "#333",
      }}
      title={tag.name}
    >
      {initial}
    </span>
  );
}
