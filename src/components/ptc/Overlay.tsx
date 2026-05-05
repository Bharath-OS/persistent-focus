import { useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, X, Flame } from "lucide-react";
import { usePtc, PERIOD_LABEL } from "@/lib/ptc-store";
import { Period } from "@/lib/ptc-types";
import { TaskList } from "./TaskList";
import { cn } from "@/lib/utils";

interface Props {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

const cornerClass = (corner: string) => {
  switch (corner) {
    case "tl": return "top-4 left-4";
    case "bl": return "bottom-16 left-4";
    case "br": return "bottom-16 right-4";
    default: return "top-4 right-4";
  }
};

export const Overlay = ({ expanded, onExpand, onCollapse }: Props) => {
  const { tasks, toggleTask, addTask, deleteTask, settings, streak, countByPeriod } = usePtc();
  const [tab, setTab] = useState<Period>("daily");
  const [hovered, setHovered] = useState(false);
  const [hoverReady, setHoverReady] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const hoverTimer = useRef<number | null>(null);

  const dailyIncomplete = tasks.filter((t) => t.period === "daily" && !t.completed).length;
  const hasOverdue = false;

  useEffect(() => {
    if (hovered && !expanded) {
      hoverTimer.current = window.setTimeout(() => setHoverReady(true), settings.hoverDelay);
    } else {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      setHoverReady(false);
    }
    return () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); };
  }, [hovered, expanded, settings.hoverDelay]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && expanded) onCollapse(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, onCollapse]);

  const periodTasks = tasks.filter((t) => t.period === tab);
  const { total, completed } = countByPeriod(tab);
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    addTask({ title: trimmed, period: tab });
    setNewTitle("");
  };

  if (expanded) {
    return (
      <div
        className={cn(
          "absolute z-30 w-[340px] rounded-2xl glass-strong shadow-overlay animate-scale-in flex flex-col",
          cornerClass(settings.overlayCorner)
        )}
        style={{ maxHeight: "min(560px, 80vh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-muted-foreground">PTC · Always on top</span>
          </div>
          <button
            onClick={onCollapse}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Collapse overlay"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Period)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 mx-3 mt-3 bg-secondary/70">
            {(["daily", "weekly", "quarterly", "yearly"] as Period[]).map((p) => {
              const c = countByPeriod(p);
              const remaining = c.total - c.completed;
              return (
                <TabsTrigger key={p} value={p} className="text-xs relative">
                  {PERIOD_LABEL[p]}
                  {remaining > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">({remaining})</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={tab} className="flex-1 min-h-0 mt-3 mx-1 overflow-y-auto">
            <TaskList
              tasks={periodTasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              emptyHint={`No ${PERIOD_LABEL[tab].toLowerCase()} tasks. Add one below!`}
              dense
            />
          </TabsContent>
        </Tabs>

        {/* Add input */}
        <form onSubmit={handleAdd} className="px-3 py-2 border-t border-border/60 flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`Add a ${PERIOD_LABEL[tab].toLowerCase()} task…`}
            className="h-8 text-sm bg-background/60"
          />
          <Button type="submit" size="icon" className="h-8 w-8 flex-shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border/60 flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-[11px] tabular-nums text-muted-foreground">{completed}/{total}</span>
          {settings.showStreak && streak > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-warning">
              <Flame className="w-3 h-3" /> {streak}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Collapsed
  const interactive = hoverReady;
  const dotColor = hasOverdue ? "bg-warning" : "bg-success";
  return (
    <button
      type="button"
      onClick={() => interactive && onExpand()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "absolute z-30 select-none rounded-full px-3.5 py-1.5 glass shadow-overlay flex items-center gap-2 transition-all",
        cornerClass(settings.overlayCorner),
        interactive ? "cursor-pointer scale-[1.02]" : "cursor-default"
      )}
      style={{ opacity: interactive ? 0.95 : settings.collapsedOpacity }}
      aria-label="Open task overlay"
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
      <span className="text-[13px] font-medium text-foreground">
        {dailyIncomplete === 0 ? "All done 🎉" : `${dailyIncomplete} todo${dailyIncomplete === 1 ? "" : "s"}`}
      </span>
      {settings.showStreak && streak > 0 && (
        <span className="flex items-center gap-0.5 text-[11px] text-warning">
          <Flame className="w-3 h-3" />{streak}
        </span>
      )}
    </button>
  );
};
