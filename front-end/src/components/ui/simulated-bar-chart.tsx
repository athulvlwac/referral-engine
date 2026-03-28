import { cn } from "@/utils/cn";

export type SimulatedBarChartProps = {
  bars: readonly number[];
  className?: string;
};

export const SimulatedBarChart = ({ bars, className }: SimulatedBarChartProps) => {
  return (
    <div className={cn("h-64 flex items-end justify-between gap-2", className)}>
      {bars.map((height, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="w-full bg-surface-container-low rounded-t-lg hover:bg-primary/40 transition-all cursor-pointer"
          style={{ height: `${Math.round(height * 100)}%` }}
        />
      ))}
    </div>
  );
};
