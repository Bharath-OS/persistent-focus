export type Period = "daily" | "weekly" | "quarterly" | "yearly";

export interface Task {
  id: string;
  title: string;
  period: Period;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  dueTime?: string;
  notes?: string;
  recurring?: boolean;
}

export interface PtcSettings {
  overlayCorner: "tl" | "tr" | "bl" | "br";
  collapsedOpacity: number; // 0.2 - 0.9
  expandedOpacity: number;
  hoverDelay: number; // ms
  showStreak: boolean;
}

export const DEFAULT_SETTINGS: PtcSettings = {
  overlayCorner: "tr",
  collapsedOpacity: 0.6,
  expandedOpacity: 0.95,
  hoverDelay: 1200,
  showStreak: true,
};
