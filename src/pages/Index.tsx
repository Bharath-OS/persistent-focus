import { useEffect, useState } from "react";
import { PtcProvider } from "@/lib/ptc-store";
import { DesktopFrame } from "@/components/ptc/DesktopFrame";
import { Overlay } from "@/components/ptc/Overlay";
import { AppWindow } from "@/components/ptc/AppWindow";
import { QuickAdd } from "@/components/ptc/QuickAdd";
import { Button } from "@/components/ui/button";
import { Pin, Plus, Maximize2, Keyboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const useClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const PtcShell = () => {
  const [overlayExpanded, setOverlayExpanded] = useState(false);
  const [windowOpen, setWindowOpen] = useState(true);
  const [quickOpen, setQuickOpen] = useState(false);
  const [keepOnTop, setKeepOnTop] = useState(true);
  const now = useClock();

  // Hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Win+T or Alt+T (browser-friendly)
      if ((e.metaKey || e.altKey) && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setOverlayExpanded((v) => !v);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setQuickOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="relative h-full w-full bg-background overflow-hidden">
      {/* Browser-like top control bar */}
      <header className="absolute top-0 left-0 right-0 z-50 h-11 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">P</div>
          <div>
            <p className="text-sm font-semibold leading-none">Perpetual Task Companion</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live web preview · Simulating Windows desktop</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant={keepOnTop ? "default" : "outline"} onClick={() => setKeepOnTop((v) => !v)}>
                <Pin className="w-3.5 h-3.5 mr-1.5" /> {keepOnTop ? "Pinned on top" : "Keep on top"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggles the simulated always-on-top overlay</TooltipContent>
          </Tooltip>
          <Button size="sm" variant="outline" onClick={() => setQuickOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Quick add
          </Button>
          <Button size="sm" variant="outline" onClick={() => setWindowOpen((v) => !v)}>
            <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> {windowOpen ? "Hide" : "Open"} dashboard
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Keyboard className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="space-y-1">
                <div><kbd className="font-mono">Alt/⌘ + T</kbd> · toggle overlay</div>
                <div><kbd className="font-mono">Ctrl + Shift + T</kbd> · quick add</div>
                <div><kbd className="font-mono">Esc</kbd> · close overlay</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* The simulated desktop fills the area below the header */}
      <div className="absolute top-11 left-0 right-0 bottom-0">
        <DesktopFrame
          clockTime={time}
          clockDate={date}
          onDesktopClick={() => overlayExpanded && setOverlayExpanded(false)}
        >
          {/* Dashboard window inside the desktop */}
          <AppWindow
            open={windowOpen}
            onClose={() => setWindowOpen(false)}
            onMinimize={() => setWindowOpen(false)}
          />

          {/* Overlay sits above app windows because it's "always on top" */}
          {keepOnTop && (
            <Overlay
              expanded={overlayExpanded}
              onExpand={() => setOverlayExpanded(true)}
              onCollapse={() => setOverlayExpanded(false)}
            />
          )}

          {/* Quick add */}
          <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
        </DesktopFrame>
      </div>
    </div>
  );
};

const Index = () => (
  <PtcProvider>
    <PtcShell />
  </PtcProvider>
);

export default Index;
