import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-green-600",
  iconBg = "bg-green-50",
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-1 truncate">{value}</p>
          {subtitle && <p className="text-[10px] sm:text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={cn("flex-shrink-0 p-2 sm:p-3 rounded-xl", iconBg)}>
          <Icon className={cn(iconColor, "w-4 h-4 sm:w-5 sm:h-5")} />
        </div>
      </div>
    </div>
  );
}
