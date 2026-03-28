import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/utils/cn";

export type MetricCardProps = {
  iconName: string;
  label: string;
  value: string;
  badge?: string;
  accentClassName?: string;
  className?: string;
};

export const MetricCard = ({
  iconName,
  label,
  value,
  badge,
  accentClassName,
  className,
}: MetricCardProps) => {
  return (
    <div className={cn("glass-card p-5 rounded-xl glow-primary transition-all duration-500 hover:scale-[1.02]", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", accentClassName ?? "bg-primary/10 text-primary")}
        >
          <MaterialIcon name={iconName} className="text-xl" />
        </div>
        {badge ? <span className="text-[10px] font-label text-primary uppercase tracking-widest">{badge}</span> : null}
      </div>
      <p className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-headline font-bold text-on-surface">{value}</h3>
    </div>
  );
};
