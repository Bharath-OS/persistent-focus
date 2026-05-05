import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Period } from "@/lib/ptc-types";
import { usePtc, PERIOD_LABEL } from "@/lib/ptc-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPeriod?: Period;
  lockPeriod?: boolean;
}

export const AddTaskDialog = ({ open, onOpenChange, defaultPeriod = "daily", lockPeriod }: Props) => {
  const { addTask } = usePtc();
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  useEffect(() => {
    if (open) {
      setTitle("");
      setPeriod(defaultPeriod);
    }
  }, [open, defaultPeriod]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({ title: trimmed, period });
    toast.success(`Added to ${PERIOD_LABEL[period]}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Add a task to your {PERIOD_LABEL[period].toLowerCase()} list.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-xs text-muted-foreground">Task title</Label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
            />
          </div>
          {!lockPeriod && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["daily","weekly","quarterly","yearly"] as Period[]).map((p) => (
                    <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()}>Add task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
