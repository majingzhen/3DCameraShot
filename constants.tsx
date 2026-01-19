
import { ViewLabel, AngleLabel, ShotLabel } from './types';

export const getViewLabel = (deg: number): ViewLabel => {
  if (deg < 45 || deg > 315) return "Front (正)";
  if (deg < 135) return "3/4 View (3/4侧面)";
  if (deg < 225) return "Side (侧面)";
  return "Back (背)";
};

export const getAngleLabel = (deg: number): AngleLabel => {
  if (deg < -30) return "Low Angle (仰视)";
  if (deg < 30) return "Eye Level (平视)";
  if (deg < 70) return "High Angle (俯视)";
  return "Overhead (顶视)";
};

export const getShotLabel = (val: number): ShotLabel => {
  if (val < 25) return "Close-up (特写)";
  if (val < 50) return "Medium (中景)";
  if (val < 75) return "Full Body (全身)";
  return "Long Shot (远景)";
};
