'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrafficReport, dummyReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { List, Clock, Frown, Lightbulb, Loader2, MoreHorizontal, RefreshCw, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const INITIAL_VISIBLE_COUNT = 20;
const REPORTS_TO_LOAD = 10;

const SeverityBadge = ({ severity }: { severity: TrafficReport['severity'] }) => {
    const variant: VariantProps<typeof badgeVariants>['variant'] = {
        low: 'success',
        medium: 'secondary',
        high: 'destructive',
    }[severity];
    
    const severityText = {
        low: 'Faible',
        medium: 'Moyen',
        high: 'Élevé'
    }[severity];

    return <Badge variant={variant}>{severityText}</Badge>;
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
                Obtenir des conseils
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
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [showTipsDialog, setShowTipsDialog] = useState(false);

  const fetchData = (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    setLoading(true);
    // Simulate fetching data
    const timer = setTimeout(() => {
      setAllReports(dummyReports.sort(() => Math.random() - 0.5)); // Shuffle for refresh effect
      setLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    }, 1500);
    return () => clearTimeout(timer);
  }

  useEffect(() => {
    fetchData();
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
        setTips(["Désolé, nous n'avons pas pu générer de conseils pour le moment. Veuillez réessayer plus tard."]);
    } finally {
        setIsTipsLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const handleUpdate = () => {
    fetchData(true);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + REPORTS_TO_LOAD);
  }

  const onDialogClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
          setSelectedReport(null);
          setTips([]);
      }, 300);
    }
    setShowTipsDialog(open);
  }

  const filteredReports = useMemo(() => 
    allReports.filter(report => 
      report.location.toLowerCase().includes(searchQuery.toLowerCase())
    ), [allReports, searchQuery]);

  const visibleReports = filteredReports.slice(0, visibleCount);

  return (
    <>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <List />
              Rapports de trafic en direct
            </div>
            <Button size="icon" variant="outline" onClick={handleUpdate} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              <span className="sr-only">Mettre à jour les rapports</span>
            </Button>
          </CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par lieu..."
              className="pl-9"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
              Array.from({ length: INITIAL_VISIBLE_COUNT }).map((_, i) => <ReportSkeleton key={i} />)
          ) : visibleReports.length > 0 ? (
            visibleReports.map((report) => (
              <ReportItem key={report.id} report={report} onGetTips={handleGetTips} />
            ))
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                  <Frown className="w-12 h-12 mb-4" />
                  <p className="font-medium">{searchQuery ? "Aucun rapport trouvé." : "Aucun rapport de trafic pour le moment."}</p>
                  <p className="text-sm">{searchQuery ? "Essayez un autre terme de recherche." : "On dirait que les routes sont dégagées !"}</p>
              </div>
          )}
        </CardContent>
        
        {!loading && visibleCount < filteredReports.length && (
            <CardFooter className="p-4 pt-2 border-t">
                <Button onClick={handleLoadMore} variant="outline" className="w-full">
                    <MoreHorizontal className="mr-2" />
                    Charger plus
                </Button>
            </CardFooter>
        )}
      </Card>

      <AlertDialog open={showTipsDialog} onOpenChange={onDialogClose}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                      <Lightbulb />
                      Conseils de circulation pour {selectedReport?.location}
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
                  <AlertDialogAction>Fermer</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
