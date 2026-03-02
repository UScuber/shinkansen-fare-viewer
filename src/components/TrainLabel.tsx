import React from "react";
import TrainIcon from "./TrainIcon";
import { isTrainTag } from "./trainTagMap";

type TrainLabelProps = {
  label: string;
};

function TrainLabel({ label }: TrainLabelProps) {
  const parts: React.ReactNode[] = [];
  const tagRegex = /<([^<>]+)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = tagRegex.exec(label)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(label.slice(lastIndex, matchIndex));
    }
    const tag = match[1];
    if (isTrainTag(tag)) {
      parts.push(<TrainIcon key={`${tag}-${matchIndex}`} tag={tag} />);
    } else {
      parts.push(match[0]);
    }
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < label.length) {
    parts.push(label.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : label}</>;
}

export default TrainLabel;
