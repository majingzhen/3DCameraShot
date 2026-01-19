
export interface CameraSettings {
  view: number; // 0-360 degrees
  angle: number; // -90 to 90 degrees
  shot: number; // 0-100 (distance/zoom)
}

export type ViewLabel = "Front (正)" | "3/4 View (3/4侧面)" | "Side (侧面)" | "Back (背)";
export type AngleLabel = "Eye Level (平视)" | "High Angle (俯视)" | "Overhead (顶视)" | "Low Angle (仰视)";
export type ShotLabel = "Close-up (特写)" | "Medium (中景)" | "Full Body (全身)" | "Long Shot (远景)";

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AppState {
  referenceImage: string | null;
  resultImage: string | null;
  isGenerating: boolean;
  apiKeySelected: boolean;
  settings: CameraSettings;
}
