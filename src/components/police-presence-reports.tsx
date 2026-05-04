
'use client';

import React, { useState, useEffect } from 'react';
import { PoliceReport } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Siren, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReportTypeBadge = ({ type }: { type: PoliceReport['type'] }) => {
    const typeMap = {
        control: { variant: 'secondary', text: 'Contrôle' },
        traffic_management: { variant: 'default', text: 'Gestion du trafic' },
        incident: { variant: 'destructive', text: 'Incident' }
    } as const;
    
    const { variant, text } = typeMap[type];

    return <Badge variant={variant}>{text}</Badge>;
}

const PoliceReportItem = ({ report }: { report: any }) => {
    const formattedTime = report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), { addSuffix: true, locale: fr }) : '...';
    return (
        <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-card-foreground">{report.location}</h3>
                <ReportTypeBadge type={report.type} />
            </div>
            <p className="text-sm text-muted-foreground">{report.note}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-3">
                <Clock className="w-3 h-3 mr-1.5" />
                <span>{formattedTime}</span>
            </div>
        </div>
    );
};

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
  const { firestore } = useFirebase();
  const reportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'police_reports'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore]);

  const { data: reports, isLoading } = useCollection(reportsQuery);

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Siren className="text-primary h-5 w-5" />
              <span>Présence Policière Signalée</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <ReportSkeleton key={i} />)
            ) : reports && reports.length > 0 ? (
              reports.map((report) => (
                  <PoliceReportItem key={report.id} report={report} />
              ))
            ) : (
                <div className="py-10 text-center bg-white rounded-3xl border-2 border-dashed">
                    <p className="text-muted-foreground text-sm font-medium">Aucun poste de police signalé actuellement.</p>
                </div>
            )}
          </div>
        </CardContent>
    </Card>
  );
}
