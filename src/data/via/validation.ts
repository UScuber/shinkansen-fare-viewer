/**
 * 経由駅設定のバリデーション
 */

import type { JourneySegment } from "../types";

/**
 * グリーン車区間が連続しているかチェック
 */
export function validateGreenContiguity(segments: JourneySegment[]): boolean {
  const greenFlags = segments.map((s) => s.seatType === "green");
  let firstGreen = -1;
  let lastGreen = -1;

  for (let i = 0; i < greenFlags.length; i++) {
    if (greenFlags[i]) {
      if (firstGreen === -1) firstGreen = i;
      lastGreen = i;
    }
  }

  if (firstGreen === -1) return true; // グリーンなし → OK

  // firstGreen〜lastGreen間に非グリーンがないか
  for (let i = firstGreen; i <= lastGreen; i++) {
    if (!greenFlags[i]) return false; // 分離NG
  }
  return true;
}
