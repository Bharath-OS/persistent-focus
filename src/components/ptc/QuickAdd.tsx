import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Period } from "@/lib/ptc-types";
import { usePtc, PERIOD_LABEL } from "@/lib/ptc-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUFFIX_MAP: Record<string, Period> = { d: "daily", w: "weekly", q: "quarterly", y: "yearly" };

export const QuickAdd = ({ open, onClose }: Props) => {
  const [value, setValue] = useState("");
  const [period, setPeriod] = useState<Period>("daily");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = usePtc();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (!open) { setValue(""); setPeriod("daily"); }
  }, [open]);

  useEffect(() => {
    const parts = value.trim().split(/\s+/);
    const last = parts[parts.length - 1]?.toLowerCase();
    if (last && SUFFIX_MAP[last] && parts.length > 1) {
      setPeriod(SUFFIX_MAP[last]);
    } else {
      setPeriod("daily");
    }
  }, [value]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = value.trim().split(/\s+/);
    const last = parts[parts.length - 1]?.toLowerCase();
    let p: Period = "daily";
    let title = value.trim();
    if (last && SUFFIX_MAP[last] && parts.length > 1) {
      p = SUFFIX_MAP[last];
      title = parts.slice(0, -1).join(" ").trim();
    }
    if (!title) return;
    addTask({ title, period: p });
    toast.success(`Added to ${PERIOD_LABEL[p]}`);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center pt-[18vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/5 backdrop-blur-[2px]" />
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[440px] rounded-2xl glass-strong shadow-window p-3 animate-scale-in"
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a task… (suffix +d / +w / +q / +y)"
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          className="h-11 text-sm border-0 bg-transparent focus-visible:ring-0"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex gap-1">
            {(["daily", "weekly", "quarterly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent"
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">Enter to save · Esc to cancel</span>
        </div>
      </form>
    </div>
  );
};
