import { TRAIN_TAG_MAP, isTrainTag } from "./trainTagMap";

type TrainIconProps = {
  tag: string;
};

function TrainIcon({ tag }: TrainIconProps) {
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
}

export default TrainIcon;
