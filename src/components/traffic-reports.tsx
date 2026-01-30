'use client';

import React, { useState, useEffect } from 'react';
import { TrafficReport, dummyReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { List, Clock, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type VariantProps } from 'class-variance-authority';

const SeverityBadge = ({ severity }: { severity: TrafficReport['severity'] }) => {
    const variant: VariantProps<typeof badgeVariants>['variant'] = {
        low: 'success',
        medium: 'secondary',
        high: 'destructive',
    }[severity];

    return <Badge variant={variant} className="capitalize">{severity}</Badge>;
}

const ReportItem = ({ report }: { report: (TrafficReport & { id: number, time: string }) }) => (
    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-card-foreground">{report.location}</h3>
            <SeverityBadge severity={report.severity} />
        </div>
        <p className="text-sm text-muted-foreground">{report.description}</p>
        <div className="flex items-center text-xs text-muted-foreground mt-3">
            <Clock className="w-3 h-3 mr-1.5" />
            <span>{report.time}</span>
        </div>
    </div>
)

const ReportSkeleton = () => (
    <div className="p-4 rounded-lg border space-y-3">
        <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-1/5" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/3" />
    </div>
)

export default function TrafficReports() {
  const [reports, setReports] = useState<(TrafficReport & {id: number, time: string})[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setReports(dummyReports);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <List />
            Live Traffic Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {loading && (
            <>
                <ReportSkeleton />
                <ReportSkeleton />
                <ReportSkeleton />
            </>
        )}
        {!loading && reports.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <Frown className="w-12 h-12 mb-4" />
                <p className="font-medium">No traffic reports right now.</p>
                <p className="text-sm">Looks like the roads are clear!</p>
            </div>
        )}
        {!loading && reports.length > 0 && reports.map((report) => (
          <ReportItem key={report.id} report={report} />
        ))}
      </CardContent>
    </Card>
  );
}
