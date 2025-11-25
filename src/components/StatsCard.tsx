import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export function StatsCard({ icon, label, value, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 text-primary">{icon}</div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
