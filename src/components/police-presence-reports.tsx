'use client';

import React from 'react';
import { PoliceReport, dummyPoliceReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Siren } from 'lucide-react';

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

export default function PolicePresenceReports() {
  const [reports] = React.useState(dummyPoliceReports);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="text-primary" />
            Présence Policière Signalée
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {reports.map((report) => (
                <PoliceReportItem key={report.id} report={report} />
            ))}
          </div>
        </CardContent>
    </Card>
  );
}
