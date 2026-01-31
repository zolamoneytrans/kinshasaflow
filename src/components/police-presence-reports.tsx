'use client';

import React, { useState, useEffect } from 'react';
import { PoliceReport, dummyPoliceReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Siren, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ReportTypeBadge = ({ type }: { type: PoliceReport['type'] }) => {
    const typeText = {
        control: 'Contrôle',
        traffic_management: 'Gestion du trafic',
        incident: 'Incident'
    }[type];
    
    const variant = {
        control: 'secondary',
        traffic_management: 'default',
        incident: 'destructive'
    }[type] as "secondary" | "default" | "destructive";

    return <Badge variant={variant}>{typeText}</Badge>;
}

const PoliceReportItem = ({ report }: { report: PoliceReport & { id: number; time: string } }) => (
    <div className="p-4 rounded-lg border bg-card transition-colors">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-card-foreground">{report.location}</h3>
            <ReportTypeBadge type={report.type} />
        </div>
        <p className="text-sm text-muted-foreground">{report.note}</p>
        <div className="flex items-center text-xs text-muted-foreground mt-3">
            <Clock className="w-3 h-3 mr-1.5" />
            <span>{report.time}</span>
        </div>
    </div>
);

const ReportSkeleton = () => (
    <div className="p-4 rounded-lg border space-y-3">
        <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-1/5" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/3" />
    </div>
);

export default function PolicePresenceReports() {
  const [reports, setReports] = useState<(PoliceReport & { id: number; time: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    setLoading(true);

    // Simulate fetching data
    const timer = setTimeout(() => {
      setReports([...dummyPoliceReports].sort(() => Math.random() - 0.5));
      setLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, []);

  const handleUpdate = () => {
    fetchData(true);
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Siren className="text-primary" />
              Présence Policière Signalée
            </div>
            <Button size="icon" variant="outline" onClick={handleUpdate} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              <span className="sr-only">Mettre à jour les rapports</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ReportSkeleton key={i} />)
            ) : (
              reports.map((report) => (
                  <PoliceReportItem key={report.id} report={report} />
              ))
            )}
          </div>
        </CardContent>
    </Card>
  );
}
