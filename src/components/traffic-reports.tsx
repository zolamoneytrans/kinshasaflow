'use client';

import { dummyReports, TrafficReport } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { List, Clock } from 'lucide-react';

const SeverityBadge = ({ severity }: { severity: TrafficReport['severity'] }) => {
    const variant: VariantProps<typeof badgeVariants>['variant'] = {
        low: 'success',
        medium: 'secondary',
        high: 'destructive',
    }[severity];

    return <Badge variant={variant} className="capitalize">{severity}</Badge>;
}

export default function TrafficReports() {
  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <List />
            Live Traffic Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {dummyReports.map((report) => (
          <div key={report.id} className="p-4 rounded-lg border bg-card/50">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{report.location}</h3>
              <SeverityBadge severity={report.severity} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
                <Clock className="w-3 h-3 mr-1" />
                <span>{report.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
