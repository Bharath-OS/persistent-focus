import { Check } from "lucide-react";
import { Task } from "@/lib/ptc-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyHint?: string;
  dense?: boolean;
}

export const TaskList = ({ tasks, onToggle, onDelete, emptyHint = "No tasks yet.", dense }: Props) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
          <Check className="w-5 h-5 text-accent-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }
  const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  return (
    <ul className="flex flex-col gap-1">
      {sorted.map((t) => (
        <li
          key={t.id}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-2.5 transition-colors hover:bg-accent/60",
            dense ? "py-1.5" : "py-2.5"
          )}
        >
          <button
            type="button"
            onClick={() => onToggle(t.id)}
            aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              t.completed
                ? "bg-success border-success text-success-foreground"
                : "border-muted-foreground/40 hover:border-primary"
            )}
          >
            {t.completed && <Check className="w-3 h-3" strokeWidth={3} />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm truncate transition-colors",
              t.completed ? "line-through text-muted-foreground" : "text-foreground"
            )}>
              {t.title}
            </p>
          </div>
          {t.dueTime && !t.completed && (
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">{t.dueTime}</span>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={() => onDelete(t.id)}
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
};
