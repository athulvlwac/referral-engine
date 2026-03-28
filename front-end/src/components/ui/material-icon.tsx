import { memo } from "react";
import { cn } from "@/utils/cn";

export type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export const MaterialIcon = memo(({ name, className, filled }: MaterialIconProps) => {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={filled ? ({ fontVariationSettings: "'FILL' 1" } as const) : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
});

MaterialIcon.displayName = "MaterialIcon";
