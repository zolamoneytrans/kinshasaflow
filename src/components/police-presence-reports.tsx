'use client';

import React, { useState, useEffect } from 'react';
import { PoliceReport, dummyPoliceReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Siren, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ReportTypeBadge = ({ type }: { type: PoliceReport['type'] }) => {
    const typeMap = {
        control: { variant: 'secondary', text: 'Contrôle' },
        traffic_management: { variant: 'default', text: 'Gestion du trafic' },
        incident: { variant: 'destructive', text: 'Incident' }
    } as const;
    
    const { variant, text } = typeMap[type];

    return <Badge variant={variant}>{text}</Badge>;
}

const PoliceReportItem = ({ report }: { report: PoliceReport & { id: number; time: string } }) => (
    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors shadow-sm">
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
    } else {
      setLoading(true);
    }

    // Simulate fetching data
    setTimeout(() => {
      setReports([...dummyPoliceReports].sort(() => Math.random() - 0.5));
      setLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }, 800);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
        fetchData(true);
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    fetchData(true);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Siren className="text-primary h-5 w-5" />
              <span>Présence Policière Signalée</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleUpdate} disabled={isRefreshing} className="h-8">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Mettre à jour</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
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
