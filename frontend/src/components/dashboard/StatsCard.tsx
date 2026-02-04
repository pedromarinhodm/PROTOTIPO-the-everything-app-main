import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "primary" | "accent" | "warning" | "info" | "destructive";
  trend?: {
    value: number;
    label: string;
  };
}

const variantClasses = {
  primary: "stats-card-primary",
  accent: "stats-card-accent",
  warning: "stats-card-warning",
  info: "stats-card-info",
  destructive: "stats-card-destructive",
};

const iconVariantClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "primary",
  trend,
}: StatsCardProps) {
  return (
    <div className={cn(variantClasses[variant], "animate-fade-in")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                trend.value >= 0 ? "text-accent" : "text-destructive"
              )}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconVariantClasses[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
