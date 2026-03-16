import type { TrainType } from "../data/types";
import TrainIcon from "./TrainIcon";

interface TrainLabelProps {
  trainTypes: TrainType[];
  suffix?: string;
}

export default function TrainLabel({ trainTypes, suffix }: TrainLabelProps) {
  return (
    <span className="inline-flex items-center gap-1">
      {trainTypes.map((t) => (
        <TrainIcon key={t} trainType={t} />
      ))}
      {suffix && <span className="text-[0.85rem]">{suffix}</span>}
    </span>
  );
}
