import wallpaper from "@/assets/desktop-wallpaper.jpg";
import { Wifi, Volume2, BatteryFull, Search, Folder, Mail } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  clockTime: string;
  clockDate: string;
  onDesktopClick?: () => void;
}

export const DesktopFrame = ({ children, clockTime, clockDate, onDesktopClick }: Props) => {
  return (
    <div className="absolute inset-0 overflow-hidden" onClick={onDesktopClick}>
      <img
        src={wallpaper}
        alt="Desktop wallpaper"
        loading="lazy"
        width={1920}
        height={1088}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* desktop icons */}
      <div className="absolute top-6 left-6 flex flex-col gap-5 z-10">
        {[
          { Icon: Folder, label: "Documents" },
          { Icon: Mail, label: "Outlook" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center w-16 text-center">
            <div className="w-12 h-12 rounded-md bg-white/10 backdrop-blur flex items-center justify-center text-white shadow-md">
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-white drop-shadow-md mt-1">{label}</span>
          </div>
        ))}
      </div>

      {children}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-foreground/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-md hover:bg-white/10 flex items-center justify-center text-white" aria-label="Start">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg>
          </button>
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-white/10 text-white/80 text-xs">
            <Search className="w-3.5 h-3.5" /> Search
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/90 px-2">
          <Wifi className="w-3.5 h-3.5" />
          <Volume2 className="w-3.5 h-3.5" />
          <BatteryFull className="w-3.5 h-3.5" />
          <div className="text-right text-[11px] leading-tight">
            <div>{clockTime}</div>
            <div>{clockDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
