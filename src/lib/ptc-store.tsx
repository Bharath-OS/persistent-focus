import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Task, Period, PtcSettings, DEFAULT_SETTINGS } from "./ptc-types";

const TASKS_KEY = "ptc.tasks.v1";
const SETTINGS_KEY = "ptc.settings.v1";
const HISTORY_KEY = "ptc.history.v1";

export interface DailyHistory {
  date: string; // yyyy-mm-dd
  total: number;
  completed: number;
}

interface PtcContextValue {
  tasks: Task[];
  settings: PtcSettings;
  history: DailyHistory[];
  addTask: (input: { title: string; period: Period; dueTime?: string; notes?: string }) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  updateSettings: (patch: Partial<PtcSettings>) => void;
  countByPeriod: (p: Period) => { total: number; completed: number };
  streak: number;
  bestStreak: number;
  resetAll: () => void;
}

const PtcContext = createContext<PtcContextValue | null>(null);

const seedTasks = (): Task[] => {
  const now = new Date().toISOString();
  return [
    { id: crypto.randomUUID(), title: "Review morning emails", period: "daily", completed: true, completedAt: now, createdAt: now, dueTime: "09:00" },
    { id: crypto.randomUUID(), title: "Finish project proposal", period: "daily", completed: false, completedAt: null, createdAt: now, dueTime: "14:00" },
    { id: crypto.randomUUID(), title: "30 min deep work block", period: "daily", completed: false, completedAt: null, createdAt: now },
    { id: crypto.randomUUID(), title: "Call dentist", period: "daily", completed: false, completedAt: null, createdAt: now },
    { id: crypto.randomUUID(), title: "Ship v2 of landing page", period: "weekly", completed: false, completedAt: null, createdAt: now },
    { id: crypto.randomUUID(), title: "Weekly 1:1 with team", period: "weekly", completed: true, completedAt: now, createdAt: now },
    { id: crypto.randomUUID(), title: "Launch marketing site", period: "quarterly", completed: false, completedAt: null, createdAt: now },
    { id: crypto.randomUUID(), title: "Hire 2 engineers", period: "quarterly", completed: false, completedAt: null, createdAt: now },
    { id: crypto.randomUUID(), title: "Read 24 books", period: "yearly", completed: false, completedAt: null, createdAt: now },
    { id: crypto.randomUUID(), title: "Run a half marathon", period: "yearly", completed: false, completedAt: null, createdAt: now },
  ];
};

const seedHistory = (): DailyHistory[] => {
  const arr: DailyHistory[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const total = 4 + Math.floor(Math.random() * 3);
    const completed = Math.max(1, Math.floor(total * (0.5 + Math.random() * 0.5)));
    arr.push({ date: d.toISOString().slice(0, 10), total, completed });
  }
  return arr;
};

export const PtcProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const s = seedTasks();
    localStorage.setItem(TASKS_KEY, JSON.stringify(s));
    return s;
  });

  const [settings, setSettings] = useState<PtcSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<DailyHistory[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const h = seedHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    return h;
  });

  useEffect(() => { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }, [history]);

  const addTask: PtcContextValue["addTask"] = useCallback((input) => {
    setTasks((prev) => [
      { id: crypto.randomUUID(), title: input.title, period: input.period, completed: false, completedAt: null, createdAt: new Date().toISOString(), dueTime: input.dueTime, notes: input.notes },
      ...prev,
    ]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t));
  }, []);

  const deleteTask = useCallback((id: string) => setTasks((p) => p.filter((t) => t.id !== id)), []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => setTasks((p) => p.map((t) => t.id === id ? { ...t, ...patch } : t)), []);
  const updateSettings = useCallback((patch: Partial<PtcSettings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const resetAll = useCallback(() => {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(HISTORY_KEY);
    setTasks(seedTasks());
    setHistory(seedHistory());
  }, []);

  const countByPeriod = useCallback((p: Period) => {
    const filtered = tasks.filter((t) => t.period === p);
    return { total: filtered.length, completed: filtered.filter((t) => t.completed).length };
  }, [tasks]);

  // todays history derived from current daily tasks
  const todayKey = new Date().toISOString().slice(0, 10);
  const fullHistory = useMemo(() => {
    const daily = tasks.filter((t) => t.period === "daily");
    const today: DailyHistory = { date: todayKey, total: daily.length, completed: daily.filter((t) => t.completed).length };
    return [...history, today];
  }, [history, tasks, todayKey]);

  const { streak, bestStreak } = useMemo(() => {
    let s = 0;
    for (let i = fullHistory.length - 1; i >= 0; i--) {
      const h = fullHistory[i];
      if (h.total > 0 && h.completed >= h.total) s++;
      else break;
    }
    const best = Math.max(s, 6);
    return { streak: s, bestStreak: best };
  }, [fullHistory]);

  const value: PtcContextValue = {
    tasks, settings, history: fullHistory,
    addTask, toggleTask, deleteTask, updateTask, updateSettings,
    countByPeriod, streak, bestStreak, resetAll,
  };

  return <PtcContext.Provider value={value}>{children}</PtcContext.Provider>;
};

export const usePtc = () => {
  const ctx = useContext(PtcContext);
  if (!ctx) throw new Error("usePtc must be used within PtcProvider");
  return ctx;
};

export const PERIOD_LABEL: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};
