import type { TrainType } from "../../data/types";
import { TRAIN_TAGS } from "../../data/trainTags";

/** 列車名を取得 */
export function getTrainName(trainType: TrainType): string {
  return TRAIN_TAGS[trainType].name;
}

/** 列車カラーを取得 */
export function getTrainColor(trainType: TrainType): string {
  return TRAIN_TAGS[trainType].color;
}

/** 列車テキストが明色かどうか */
export function isTrainTextLight(trainType: TrainType): boolean {
  return TRAIN_TAGS[trainType].textLight;
}
