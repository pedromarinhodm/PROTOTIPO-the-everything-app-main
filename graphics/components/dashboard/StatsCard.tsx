"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "primary" | "accent" | "destructive" | "warning";
  description?: string;
}

const variantStyles: Record<string, { icon: string; border: string }> = {
  primary: {
    icon: "text-primary",
    border: "border-l-4 border-l-primary",
  },
  accent: {
    icon: "text-chart-2",
    border: "border-l-4 border-l-chart-2",
  },
  destructive: {
    icon: "text-destructive",
    border: "border-l-4 border-l-destructive",
  },
  warning: {
    icon: "text-chart-4",
    border: "border-l-4 border-l-chart-4",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "primary",
  description,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("transition-shadow hover:shadow-md", styles.border)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("rounded-lg bg-muted p-2.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value.toLocaleString("pt-BR")}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
