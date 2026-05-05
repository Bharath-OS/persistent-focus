import { useMemo, useState } from "react";
import { ReactNode } from "react";
import { Minus, Square, X, LayoutDashboard, CalendarDays, CalendarRange, Target, Globe, Settings as SettingsIcon, Flame, TrendingUp, CheckCircle2 } from "lucide-react";
import { usePtc, PERIOD_LABEL } from "@/lib/ptc-store";
import { Period } from "@/lib/ptc-types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskList } from "./TaskList";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface Props {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

type View = "dashboard" | Period | "settings";

const NAV: { key: View; label: string; Icon: any }[] = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "daily", label: "Daily", Icon: CalendarDays },
  { key: "weekly", label: "Weekly", Icon: CalendarRange },
  { key: "quarterly", label: "Quarterly", Icon: Target },
  { key: "yearly", label: "Yearly", Icon: Globe },
  { key: "settings", label: "Settings", Icon: SettingsIcon },
];

const periodIcon: Record<Period, any> = { daily: CalendarDays, weekly: CalendarRange, quarterly: Target, yearly: Globe };

export const AppWindow = ({ open, onClose, onMinimize }: Props) => {
  const ptc = usePtc();
  const [view, setView] = useState<View>("dashboard");

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pb-16 animate-fade-in">
      <div className="w-full h-full max-w-[1180px] max-h-[760px] rounded-xl overflow-hidden shadow-window bg-card flex flex-col">
        {/* Title bar */}
        <div className="h-9 bg-secondary/70 border-b border-border flex items-center justify-between pl-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            Perpetual Task Companion
          </div>
          <div className="flex items-stretch h-full">
            <button onClick={onMinimize} className="w-11 hover:bg-accent flex items-center justify-center text-muted-foreground" aria-label="Minimize"><Minus className="w-3.5 h-3.5"/></button>
            <button className="w-11 hover:bg-accent flex items-center justify-center text-muted-foreground" aria-label="Maximize"><Square className="w-3 h-3"/></button>
            <button onClick={onClose} className="w-11 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center text-muted-foreground" aria-label="Close"><X className="w-3.5 h-3.5"/></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className="w-52 bg-background border-r border-border flex flex-col py-4 px-2">
            {NAV.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  view === key ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <div className="mt-auto px-3 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-warning" />
                Streak: <span className="font-medium text-foreground">{ptc.streak} days</span>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-background">
            {view === "dashboard" && <Dashboard onNav={setView} />}
            {(["daily","weekly","quarterly","yearly"] as Period[]).includes(view as Period) && (
              <PeriodView period={view as Period} />
            )}
            {view === "settings" && <SettingsView />}
          </main>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ onNav }: { onNav: (v: View) => void }) => {
  const ptc = usePtc();
  const periods: Period[] = ["daily", "weekly", "quarterly", "yearly"];

  const chartData = useMemo(() =>
    ptc.history.slice(-7).map((h) => ({
      day: new Date(h.date).toLocaleDateString(undefined, { weekday: "short" }),
      pct: h.total === 0 ? 0 : Math.round((h.completed / h.total) * 100),
      completed: h.completed,
      total: h.total,
    })),
  [ptc.history]);

  const avg = chartData.length ? Math.round(chartData.reduce((a, b) => a + b.pct, 0) / chartData.length) : 0;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Good to see you 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's how your follow-through looks today.</p>
      </header>

      <section className="grid grid-cols-4 gap-4">
        {periods.map((p) => {
          const { total, completed } = ptc.countByPeriod(p);
          const pct = total === 0 ? 0 : (completed / total) * 100;
          const Icon = periodIcon[p];
          return (
            <button
              key={p}
              onClick={() => onNav(p)}
              className="text-left bg-card border border-border rounded-xl p-4 shadow-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icon className="w-3.5 h-3.5" />
                {PERIOD_LABEL[p]}
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-semibold tabular-nums">{completed}</span>
                <span className="text-sm text-muted-foreground">/ {total}</span>
              </div>
              <Progress value={pct} className="h-1.5 mt-3" />
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="col-span-3 bg-card border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Completion · Last 7 days</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Average {avg}% — keep the momentum.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground">Daily</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any, _n, p: any) => [`${value}% (${p.payload.completed}/${p.payload.total})`, "Completion"]}
                />
                <ReferenceLine y={avg} stroke="hsl(var(--primary))" strokeDasharray="4 4" />
                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <StatCard title="Current streak" value={`${ptc.streak} days`} hint="Complete all daily tasks to extend." Icon={Flame} accent="warning" />
        <StatCard title="Best streak" value={`${ptc.bestStreak} days`} hint="Your record. Beat it!" Icon={TrendingUp} accent="primary" />
      </section>
    </div>
  );
};

const StatCard = ({ title, value, hint, Icon, accent }: { title: string; value: string; hint: string; Icon: any; accent: "warning" | "primary" }) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center gap-4">
    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center",
      accent === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary")}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl font-semibold mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </div>
  </div>
);

const PeriodView = ({ period }: { period: Period }) => {
  const ptc = usePtc();
  const [title, setTitle] = useState("");
  const tasks = ptc.tasks.filter((t) => t.period === period);
  const { total, completed } = ptc.countByPeriod(period);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    ptc.addTask({ title: title.trim(), period });
    setTitle("");
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{PERIOD_LABEL[period]} Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{completed} of {total} completed</p>
        </div>
      </header>

      <form onSubmit={submit} className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Add a ${PERIOD_LABEL[period].toLowerCase()} task…`} />
        <Button type="submit">Add task</Button>
      </form>

      <div className="bg-card border border-border rounded-xl p-3 shadow-card">
        <TaskList tasks={tasks} onToggle={ptc.toggleTask} onDelete={ptc.deleteTask} emptyHint={`No ${PERIOD_LABEL[period].toLowerCase()} tasks yet. Add your first above.`} />
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { settings, updateSettings, resetAll } = usePtc();
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Tune the overlay to fit your workflow.</p>
      </header>

      <section className="bg-card border border-border rounded-xl p-5 shadow-card space-y-5">
        <h2 className="text-sm font-semibold">Overlay</h2>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Screen position</Label>
          <Select value={settings.overlayCorner} onValueChange={(v) => updateSettings({ overlayCorner: v as any })}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tl">Top-left</SelectItem>
              <SelectItem value="tr">Top-right</SelectItem>
              <SelectItem value="bl">Bottom-left</SelectItem>
              <SelectItem value="br">Bottom-right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs text-muted-foreground">Collapsed opacity</Label><span className="text-xs tabular-nums">{Math.round(settings.collapsedOpacity * 100)}%</span></div>
          <Slider value={[settings.collapsedOpacity * 100]} min={20} max={90} step={5} onValueChange={([v]) => updateSettings({ collapsedOpacity: v / 100 })} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs text-muted-foreground">Hover activation delay</Label><span className="text-xs tabular-nums">{settings.hoverDelay}ms</span></div>
          <Slider value={[settings.hoverDelay]} min={0} max={2000} step={100} onValueChange={([v]) => updateSettings({ hoverDelay: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Show streak</Label>
            <p className="text-xs text-muted-foreground">Display 🔥 in the collapsed widget.</p>
          </div>
          <Switch checked={settings.showStreak} onCheckedChange={(c) => updateSettings({ showStreak: c })} />
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-semibold">Hotkeys</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between bg-secondary rounded-md px-3 py-2">
            <span className="text-muted-foreground">Toggle overlay</span>
            <kbd className="text-xs bg-background border border-border rounded px-1.5 py-0.5">⊞ + T</kbd>
          </div>
          <div className="flex items-center justify-between bg-secondary rounded-md px-3 py-2">
            <span className="text-muted-foreground">Quick add task</span>
            <kbd className="text-xs bg-background border border-border rounded px-1.5 py-0.5">Ctrl + Shift + T</kbd>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Reset demo data</h2>
          <p className="text-xs text-muted-foreground">Restores seed tasks and history.</p>
        </div>
        <Button variant="outline" onClick={resetAll}>Reset</Button>
      </section>
    </div>
  );
};
