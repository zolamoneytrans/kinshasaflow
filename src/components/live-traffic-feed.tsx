'use client';

import React, { useState, useEffect } from 'react';
import { TrafficReport, dummyReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type LiveReport = TrafficReport & { id: number; time: string };

const MAX_LIVE_REPORTS = 15;
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

const SeverityBadge = ({ severity }: { severity: TrafficReport['severity'] }) => {
    const severityMap = {
        low: { variant: 'success', text: 'Faible' },
        medium: { variant: 'secondary', text: 'Moyen' },
        high: { variant: 'destructive', text: 'Élevé' },
    } as const;

    const { variant, text } = severityMap[severity];

    return <Badge variant={variant}>{text}</Badge>;
}

const LiveReportItem = ({ report }: { report: LiveReport }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        className="p-4 rounded-lg border bg-card transition-colors"
    >
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-card-foreground">{report.location}</h3>
            <SeverityBadge severity={report.severity} />
        </div>
        <p className="text-sm text-muted-foreground">{report.description}</p>
        <div className="flex items-center text-xs text-muted-foreground mt-3">
            <Clock className="w-3 h-3 mr-1.5" />
            <span>{report.time}</span>
        </div>
    </motion.div>
);

let reportIdCounter = 100;

export default function LiveTrafficFeed() {
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);

  useEffect(() => {
    // Initial data
    const initialData = dummyReports
      .slice(0, 5)
      .map((r, i) => ({ ...r, id: reportIdCounter++, time: `il y a ${5 + i*2}m` }))
      .reverse();
    setLiveReports(initialData);

    const interval = setInterval(() => {
      setLiveReports(prevReports => {
        const randomReport = dummyReports[Math.floor(Math.random() * dummyReports.length)];
        const newReport: LiveReport = {
          ...randomReport,
          id: reportIdCounter++,
          time: "à l'instant",
        };
        
        const updatedReports = [newReport, ...prevReports.map(r => {
            if (r.time === "à l'instant") {
                return {...r, time: "il y a 1m"};
            }
            if (r.time.startsWith('il y a')) {
                const minutes = parseInt(r.time.match(/\d+/)?.[0] || '0') + 1;
                return {...r, time: `il y a ${minutes}m`};
            }
            return r;
        })];
        
        return updatedReports.slice(0, MAX_LIVE_REPORTS);
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Activity className="text-destructive animate-pulse" />
              Flux de trafic en direct
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
                {liveReports.map((report) => (
                    <LiveReportItem key={report.id} report={report} />
                ))}
            </AnimatePresence>
          </div>
        </CardContent>
    </Card>
  );
}
