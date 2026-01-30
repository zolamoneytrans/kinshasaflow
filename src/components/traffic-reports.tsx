'use client';

import React, { useState, useEffect } from 'react';
import { TrafficReport, dummyReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { List, Clock, Frown, Lightbulb, Loader2, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getTrafficTipsAction } from '@/app/actions';

type Report = TrafficReport & { id: number, time: string };

const INITIAL_VISIBLE_COUNT = 4;
const REPORTS_TO_LOAD = 4;

const SeverityBadge = ({ severity }: { severity: TrafficReport['severity'] }) => {
    const variant: VariantProps<typeof badgeVariants>['variant'] = {
        low: 'success',
        medium: 'secondary',
        high: 'destructive',
    }[severity];

    return <Badge variant={variant} className="capitalize">{severity}</Badge>;
}

const ReportItem = ({ report, onGetTips }: { report: Report, onGetTips: (report: Report) => void }) => (
    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-card-foreground">{report.location}</h3>
            <SeverityBadge severity={report.severity} />
        </div>
        <p className="text-sm text-muted-foreground">{report.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
            <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1.5" />
                <span>{report.time}</span>
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onGetTips(report)}>
                <Lightbulb className="w-4 h-4 mr-1" />
                Get Tips
            </Button>
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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [showTipsDialog, setShowTipsDialog] = useState(false);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setReports(dummyReports);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetTips = async (report: Report) => {
    setSelectedReport(report);
    setShowTipsDialog(true);
    setIsTipsLoading(true);
    setTips([]);
    try {
        const result = await getTrafficTipsAction({
            location: report.location,
            description: report.description,
        });
        setTips(result.tips);
    } catch (error) {
        console.error("Failed to get tips:", error);
        setTips(["Sorry, we couldn't generate tips at this time. Please try again later."]);
    } finally {
        setIsTipsLoading(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + REPORTS_TO_LOAD);
  }

  const onDialogClose = (open: boolean) => {
    if (!open) {
      // Give animation time to finish
      setTimeout(() => {
          setSelectedReport(null);
          setTips([]);
      }, 300);
    }
    setShowTipsDialog(open);
  }

  const visibleReports = reports.slice(0, visibleCount);

  return (
    <>
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
          {!loading && visibleReports.length > 0 && visibleReports.map((report) => (
            <ReportItem key={report.id} report={report} onGetTips={handleGetTips} />
          ))}
        </CardContent>
        
        {!loading && visibleCount < reports.length && (
            <CardFooter className="p-4 pt-2 border-t">
                <Button onClick={handleLoadMore} variant="outline" className="w-full">
                    <MoreHorizontal className="mr-2" />
                    Load More
                </Button>
            </CardFooter>
        )}
      </Card>

      <AlertDialog open={showTipsDialog} onOpenChange={onDialogClose}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                      <Lightbulb />
                      Traffic Tips for {selectedReport?.location}
                  </AlertDialogTitle>
                  <div className="min-h-[100px] text-sm text-muted-foreground pt-2">
                    {isTipsLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ul className="list-disc pl-5 mt-2 space-y-2 text-foreground">
                            {tips.map((tip, index) => <li key={index}>{tip}</li>)}
                        </ul>
                    )}
                  </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction>Close</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
