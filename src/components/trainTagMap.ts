import type { TrainType } from "../data/types";
import { TRAIN_TAGS } from "../data/trainTags";

/** 全列車タグをエクスポート（コンポーネントから利用） */
export const trainTagMap = TRAIN_TAGS;

/** 列車名一覧を取得 */
export function getAllTrainNames(): { id: TrainType; name: string }[] {
  return Object.values(TRAIN_TAGS).map((t) => ({ id: t.id, name: t.name }));
}
